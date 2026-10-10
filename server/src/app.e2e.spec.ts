import 'reflect-metadata';
process.env.JWT_ACCESS_SECRET = 'test-access';
process.env.JWT_REFRESH_SECRET = 'test-refresh';
process.env.BASE_URL = 'http://short.test';
process.env.FRONTEND_URL = 'http://front.test';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ApiKeyRepository } from './modules/auth/domain/api-key.repository';
import { UserRepository } from './modules/auth/domain/user.repository';
import { AnalyticsRepository } from './modules/analytics/domain/analytics.repository';
import { ClickData, ClickRepository } from './modules/links/domain/click.repository';
import { Link } from './modules/links/domain/link.entity';
import { LinkCache } from './modules/links/domain/link-cache';
import { CreateLinkData, LinkRepository, UpdateLinkData } from './modules/links/domain/link.repository';
import { DomainError } from './shared/domain/errors';
import { PrismaService } from './shared/infrastructure/prisma.service';
import { RedisService } from './shared/infrastructure/redis.service';

// ---------- in-memory fakes (no Postgres / Redis needed) ----------
class MemLinks implements LinkRepository {
  rows = new Map<number, Link>();
  seq = 1;
  async create(d: CreateLinkData) {
    if ([...this.rows.values()].some((l) => l.shortCode === d.shortCode)) throw new DomainError('conflict', 'taken');
    const link = new Link({ id: this.seq++, ...d, clickCount: 0, isActive: true, createdAt: new Date() });
    this.rows.set(link.id, link);
    return link;
  }
  async findByCode(c: string) { return [...this.rows.values()].find((l) => l.shortCode === c) ?? null; }
  async findById(id: number) { return this.rows.get(id) ?? null; }
  async list(q: { userId: string; page: number; pageSize: number }) {
    const items = [...this.rows.values()].filter((l) => l.userId === q.userId);
    return { items, total: items.length };
  }
  async update(id: number, _u: string, d: UpdateLinkData) {
    const next = new Link({ ...this.rows.get(id)!, ...d } as never);
    this.rows.set(id, next);
    return next;
  }
  async deleteMany(ids: number[], userId: string) {
    const codes: string[] = [];
    for (const id of ids) {
      const l = this.rows.get(id);
      if (l && l.userId === userId) { codes.push(l.shortCode); this.rows.delete(id); }
    }
    return codes;
  }
  async consumeClick(id: number) {
    const l = this.rows.get(id)!;
    if (l.maxClicks !== null && l.clickCount >= l.maxClicks) return false;
    l.clickCount++;
    return true;
  }
  async incrementClicks(id: number) { this.rows.get(id)!.clickCount++; }
  async listTags() { return []; }
}

class MemUsers implements UserRepository {
  rows: any[] = [];
  async create(d: { email: string; passwordHash: string }) {
    const u = { id: `u${this.rows.length + 1}`, role: 'USER', refreshTokenHash: null, createdAt: new Date(), ...d };
    this.rows.push(u);
    return u;
  }
  async findByEmail(e: string) { return this.rows.find((u) => u.email === e) ?? null; }
  async findById(id: string) { return this.rows.find((u) => u.id === id) ?? null; }
  async setRefreshTokenHash(id: string, h: string | null) { this.rows.find((u) => u.id === id).refreshTokenHash = h; }
}

class MemKeys implements ApiKeyRepository {
  rows: any[] = [];
  async create(d: any) { const r = { id: `k${this.rows.length + 1}`, createdAt: new Date(), ...d }; this.rows.push(r); return r; }
  async listByUser(userId: string) { return this.rows.filter((r) => r.userId === userId); }
  async delete(id: string, userId: string) {
    const n = this.rows.length;
    this.rows = this.rows.filter((r) => !(r.id === id && r.userId === userId));
    return this.rows.length < n;
  }
  async findUserByHash(h: string) {
    const k = this.rows.find((r) => r.keyHash === h);
    return k ? { id: k.userId, email: 'x', role: 'USER' } : null;
  }
}

class MemCache implements LinkCache {
  m = new Map<string, Link>();
  async get(c: string) { return this.m.get(c) ?? null; }
  async set(l: Link) { this.m.set(l.shortCode, l); }
  async invalidate(c: string) { this.m.delete(c); }
}

describe('URL shortener API (e2e, in-memory)', () => {
  let app: INestApplication;
  let base: string;
  const clicks: ClickData[] = [];
  const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue({ $queryRaw: async () => [1] })
      .overrideProvider(RedisService).useValue({ get: async () => null, set: async () => undefined, del: async () => undefined })
      .overrideProvider(LinkRepository).useValue(new MemLinks())
      .overrideProvider(UserRepository).useValue(new MemUsers())
      .overrideProvider(ApiKeyRepository).useValue(new MemKeys())
      .overrideProvider(LinkCache).useValue(new MemCache())
      .overrideProvider(ClickRepository).useValue({ record: async (d: ClickData) => void clicks.push(d) })
      .overrideProvider(AnalyticsRepository).useValue({
        linkAnalytics: async () => ({ totalClicks: 0, uniqueVisitors: 0, timeSeries: [], countries: [], devices: [], browsers: [], operatingSystems: [], referrers: [] }),
        userSummary: async () => ({ totalLinks: 0, totalClicks: 0, clicksLast7Days: 0, timeSeries: [], topLinks: [] }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0);
    base = await app.getUrl();
  });

  afterAll(async () => app.close());

  const call = (path: string, init: RequestInit & { token?: string } = {}) =>
    fetch(base + path, {
      redirect: 'manual',
      ...init,
      headers: {
        'content-type': 'application/json',
        ...UA,
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
        ...(init.headers as Record<string, string>),
      },
    });

  let token = '';
  let cookie = '';

  it('health check works', async () => {
    expect((await call('/api/health')).status).toBe(200);
  });

  it('registers and sets an httpOnly refresh cookie', async () => {
    const res = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'A@Test.com', password: 'password123' }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe('a@test.com');
    token = body.accessToken;
    cookie = res.headers.getSetCookie()[0];
    expect(cookie).toContain('HttpOnly');
  });

  it('rejects duplicate registration and bad logins', async () => {
    expect((await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'a@test.com', password: 'password123' }) })).status).toBe(409);
    expect((await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'a@test.com', password: 'wrong-pass' }) })).status).toBe(401);
  });

  it('refreshes the session using the cookie and rotates it', async () => {
    const res = await call('/api/auth/refresh', { method: 'POST', headers: { cookie: cookie.split(';')[0] } });
    expect(res.status).toBe(200);
    expect((await res.json()).accessToken).toBeTruthy();
    // old refresh token is now invalid (rotation)
    const replay = await call('/api/auth/refresh', { method: 'POST', headers: { cookie: cookie.split(';')[0] } });
    expect(replay.status).toBe(401);
  });

  it('lets anonymous users shorten a plain URL but not use advanced options', async () => {
    const ok = await call('/api/links', { method: 'POST', body: JSON.stringify({ url: 'https://example.com/long/path' }) });
    expect(ok.status).toBe(201);
    expect((await ok.json()).shortUrl).toMatch(/^http:\/\/short\.test\/[0-9A-Za-z]{7}$/);
    const denied = await call('/api/links', { method: 'POST', body: JSON.stringify({ url: 'https://example.com', alias: 'custom1' }) });
    expect(denied.status).toBe(403);
  });

  it('validates input', async () => {
    expect((await call('/api/links', { method: 'POST', body: JSON.stringify({ url: 'not-a-url' }) })).status).toBe(400);
    expect((await call('/api/links', { method: 'POST', body: JSON.stringify({ url: 'http://short.test/abc' }) })).status).toBe(400);
  });

  it('creates a custom alias, redirects with 302, records a click', async () => {
    const created = await call('/api/links', { method: 'POST', token, body: JSON.stringify({ url: 'https://example.com/target', alias: 'my-link', tags: ['Work'] }) });
    expect(created.status).toBe(201);
    expect((await created.json()).tags).toEqual(['work']);

    const dup = await call('/api/links', { method: 'POST', token, body: JSON.stringify({ url: 'https://example.com', alias: 'my-link' }) });
    expect(dup.status).toBe(409);

    const redirect = await call('/my-link', { headers: { referer: 'https://news.ycombinator.com/item?id=1' } });
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get('location')).toBe('https://example.com/target');
    await new Promise((r) => setTimeout(r, 50));
    expect(clicks.at(-1)).toMatchObject({ browser: 'Chrome', os: 'Windows', device: 'Desktop', referrer: 'news.ycombinator.com' });
  });

  it('redirects unknown codes to the frontend', async () => {
    const res = await call('/nope123');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://front.test/link-unavailable?reason=not_found');
  });

  it('enforces click limits', async () => {
    await call('/api/links', { method: 'POST', token, body: JSON.stringify({ url: 'https://example.com/lim', alias: 'limited', maxClicks: 2 }) });
    expect((await call('/limited')).headers.get('location')).toBe('https://example.com/lim');
    expect((await call('/limited')).headers.get('location')).toBe('https://example.com/lim');
    expect((await call('/limited')).headers.get('location')).toContain('reason=limit_reached');
  });

  it('protects links with a password', async () => {
    await call('/api/links', { method: 'POST', token, body: JSON.stringify({ url: 'https://example.com/secret', alias: 'secret', password: 'hunter22' }) });
    expect((await call('/secret')).headers.get('location')).toBe('http://front.test/protected/secret');
    expect((await call('/api/public/unlock/secret', { method: 'POST', body: JSON.stringify({ password: 'nope' }) })).status).toBe(403);
    const ok = await call('/api/public/unlock/secret', { method: 'POST', body: JSON.stringify({ password: 'hunter22' }) });
    expect((await ok.json()).url).toBe('https://example.com/secret');
  });

  it('can disable, edit and delete a link (and invalidates the cache)', async () => {
    const list = await (await call('/api/links', { token })).json();
    const link = list.items.find((l: any) => l.shortCode === 'my-link');

    await call(`/api/links/${link.id}`, { method: 'PATCH', token, body: JSON.stringify({ isActive: false }) });
    expect((await call('/my-link')).headers.get('location')).toContain('reason=disabled');

    const edited = await call(`/api/links/${link.id}`, { method: 'PATCH', token, body: JSON.stringify({ isActive: true, url: 'https://example.com/new' }) });
    expect((await edited.json()).originalUrl).toBe('https://example.com/new');
    expect((await call('/my-link')).headers.get('location')).toBe('https://example.com/new');

    const qr = await (await call(`/api/links/${link.id}/qr`, { token })).json();
    expect(qr.dataUrl).toMatch(/^data:image\/png;base64,/);

    expect((await call(`/api/links/${link.id}`, { method: 'DELETE', token })).status).toBe(204);
    expect((await call('/my-link')).headers.get('location')).toContain('reason=not_found');
  });

  it("does not expose other users' links", async () => {
    const other = await (await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'b@test.com', password: 'password123' }) })).json();
    const mine = await (await call('/api/links', { token })).json();
    const res = await call(`/api/links/${mine.items[0].id}`, { token: other.accessToken });
    expect(res.status).toBe(404);
  });

  it('supports API keys and bulk shortening', async () => {
    const key = await (await call('/api/api-keys', { method: 'POST', token, body: JSON.stringify({ name: 'ci' }) })).json();
    expect(key.key).toMatch(/^sk_/);
    const res = await call('/api/links/bulk', {
      method: 'POST',
      headers: { 'x-api-key': key.key },
      body: JSON.stringify({ urls: ['https://a.example.com', 'bad url', 'https://b.example.com'] }),
    });
    const results = await res.json();
    expect(results.map((r: any) => !!r.link)).toEqual([true, false, true]);
    expect((await call('/api/links')).status).toBe(401);
  });

  it('serves analytics endpoints', async () => {
    const summary = await call('/api/analytics/summary?days=7', { token });
    expect(summary.status).toBe(200);
    expect((await summary.json()).timeSeries).toHaveLength(7);
  });
});
