import { DomainError } from '../../../shared/domain/errors';
import { Link } from './link.entity';
import { OriginalUrl } from './original-url';
import { ShortCode } from './short-code';
import { parseUserAgent } from './user-agent';

describe('ShortCode', () => {
  it('generates 7-char base62 codes', () => {
    for (let i = 0; i < 50; i++) expect(ShortCode.generate().value).toMatch(/^[0-9A-Za-z]{7}$/);
  });
  it('accepts valid aliases', () => expect(ShortCode.create('my-portfolio').value).toBe('my-portfolio'));
  it.each(['ab', 'has space', 'bad/slash', 'api', 'Login'])('rejects %s', (alias) => {
    expect(() => ShortCode.create(alias)).toThrow(DomainError);
  });
});

describe('OriginalUrl', () => {
  it('accepts http(s) URLs', () => expect(OriginalUrl.create('https://example.com/a?b=1').value).toContain('example.com'));
  it.each(['', 'not a url', 'javascript:alert(1)', 'ftp://x.com'])('rejects %p', (u) => {
    expect(() => OriginalUrl.create(u)).toThrow(DomainError);
  });
});

describe('Link status', () => {
  const base = {
    id: 1, shortCode: 'abc', originalUrl: 'https://x.com', userId: null, expiresAt: null,
    maxClicks: null, clickCount: 0, passwordHash: null, isActive: true, createdAt: new Date(), tags: [],
  };
  it('is active by default', () => expect(new Link(base).status()).toBe('active'));
  it('detects disabled', () => expect(new Link({ ...base, isActive: false }).status()).toBe('disabled'));
  it('detects expired', () => expect(new Link({ ...base, expiresAt: new Date(Date.now() - 1000) }).status()).toBe('expired'));
  it('detects click limit', () => expect(new Link({ ...base, maxClicks: 5, clickCount: 5 }).status()).toBe('limit_reached'));
});

describe('parseUserAgent', () => {
  it('parses desktop Chrome on Windows', () => {
    const r = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36');
    expect(r).toMatchObject({ device: 'Desktop', browser: 'Chrome', os: 'Windows', isBot: false });
  });
  it('parses iPhone Safari', () => {
    const r = parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Mobile/15E148 Safari/604.1');
    expect(r).toMatchObject({ device: 'Mobile', browser: 'Safari', os: 'iOS' });
  });
  it('flags bots', () => expect(parseUserAgent('Googlebot/2.1').isBot).toBe(true));
});
