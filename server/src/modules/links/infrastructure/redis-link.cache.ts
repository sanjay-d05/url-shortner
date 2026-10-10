import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../shared/infrastructure/redis.service';
import { Link } from '../domain/link.entity';
import { LinkCache } from '../domain/link-cache';

const TTL_SECONDS = 60 * 60;
const key = (code: string) => `link:${code}`;

@Injectable()
export class RedisLinkCache implements LinkCache {
  constructor(private readonly redis: RedisService) {}

  async get(code: string): Promise<Link | null> {
    const raw = await this.redis.get(key(code));
    if (!raw) return null;
    const p = JSON.parse(raw);
    return new Link({
      ...p,
      expiresAt: p.expiresAt ? new Date(p.expiresAt) : null,
      createdAt: new Date(p.createdAt),
    });
  }

  async set(link: Link): Promise<void> {
    await this.redis.set(key(link.shortCode), JSON.stringify(link), TTL_SECONDS);
  }

  async invalidate(code: string): Promise<void> {
    await this.redis.del(key(code));
  }
}
