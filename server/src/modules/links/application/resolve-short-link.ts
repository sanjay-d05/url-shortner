import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../../../shared/domain/password-hasher';
import { Link } from '../domain/link.entity';
import { LinkCache } from '../domain/link-cache';
import { LinkRepository } from '../domain/link.repository';

export type UnavailableReason = 'not_found' | 'disabled' | 'expired' | 'limit_reached';

export type ResolveResult =
  | { status: 'ok'; link: Link; url: string }
  | { status: 'password_required'; link: Link }
  | { status: 'wrong_password'; link: Link }
  | { status: 'unavailable'; reason: UnavailableReason };

const CACHE_STATUS_MAP = {
  disabled: 'disabled',
  expired: 'expired',
  limit_reached: 'limit_reached',
} as const;

@Injectable()
export class ResolveShortLink {
  constructor(
    private readonly links: LinkRepository,
    private readonly cache: LinkCache,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(code: string, password?: string): Promise<ResolveResult> {
    // 1. Redis first, then Postgres
    const cached = await this.cache.get(code);
    const link = cached ?? (await this.links.findByCode(code));
    if (!link) return { status: 'unavailable', reason: 'not_found' };

    // Links with a click limit need a fresh click count, so they are never cached.
    if (!cached && link.maxClicks === null) await this.cache.set(link);

    // 2. Availability rules
    const status = link.status();
    if (status !== 'active') return { status: 'unavailable', reason: CACHE_STATUS_MAP[status] };

    // 3. Password protection
    if (link.passwordHash) {
      if (!password) return { status: 'password_required', link };
      if (!(await this.hasher.compare(password, link.passwordHash))) {
        return { status: 'wrong_password', link };
      }
    }

    // 4. Atomically consume a click for limited links (prevents overshooting under load)
    if (link.maxClicks !== null && !(await this.links.consumeClick(link.id))) {
      return { status: 'unavailable', reason: 'limit_reached' };
    }

    return { status: 'ok', link, url: link.originalUrl };
  }
}
