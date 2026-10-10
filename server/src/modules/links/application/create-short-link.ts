import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors';
import { PasswordHasher } from '../../../shared/domain/password-hasher';
import { Link } from '../domain/link.entity';
import { normalizeTags, parseFutureDate } from '../domain/link-rules';
import { LinkRepository } from '../domain/link.repository';
import { OriginalUrl } from '../domain/original-url';
import { ShortCode } from '../domain/short-code';
import { UrlSafetyChecker } from '../domain/url-safety-checker';

export interface CreateLinkInput {
  url: string;
  alias?: string;
  expiresAt?: string | Date | null;
  maxClicks?: number | null;
  password?: string | null;
  tags?: string[];
  userId: string | null;
}

@Injectable()
export class CreateShortLink {
  constructor(
    private readonly links: LinkRepository,
    private readonly hasher: PasswordHasher,
    private readonly safety: UrlSafetyChecker,
  ) {}

  async execute(input: CreateLinkInput): Promise<Link> {
    const url = OriginalUrl.create(input.url);

    const usesAdvancedOptions = !!(
      input.alias || input.password || input.expiresAt || input.maxClicks || input.tags?.length
    );
    if (!input.userId && usesAdvancedOptions) {
      throw new DomainError('forbidden', 'Sign in to use aliases, passwords, expiry, click limits or tags');
    }

    if (!(await this.safety.isSafe(url.value))) {
      throw new DomainError('validation', 'This URL is not allowed');
    }

    const base = {
      originalUrl: url.value,
      userId: input.userId,
      expiresAt: parseFutureDate(input.expiresAt),
      maxClicks: input.maxClicks ?? null,
      passwordHash: input.password ? await this.hasher.hash(input.password) : null,
      tags: normalizeTags(input.tags),
    };

    if (input.alias) {
      return this.links.create({ ...base, shortCode: ShortCode.create(input.alias).value });
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.links.create({ ...base, shortCode: ShortCode.generate().value });
      } catch (e) {
        if (!(e instanceof DomainError && e.kind === 'conflict')) throw e;
      }
    }
    throw new DomainError('conflict', 'Could not generate a unique code, please retry');
  }
}
