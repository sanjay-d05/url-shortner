import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors';
import { PasswordHasher } from '../../../shared/domain/password-hasher';
import { Link } from '../domain/link.entity';
import { LinkCache } from '../domain/link-cache';
import { assertOwner, normalizeTags, parseFutureDate } from '../domain/link-rules';
import { LinkRepository, ListLinksQuery, UpdateLinkData } from '../domain/link.repository';
import { OriginalUrl } from '../domain/original-url';
import { UrlSafetyChecker } from '../domain/url-safety-checker';
import { CreateShortLink } from './create-short-link';

@Injectable()
export class ListLinks {
  constructor(private readonly links: LinkRepository) {}
  execute(query: ListLinksQuery) {
    return this.links.list(query);
  }
}

@Injectable()
export class GetOwnedLink {
  constructor(private readonly links: LinkRepository) {}
  async execute(id: number, userId: string): Promise<Link> {
    return assertOwner(await this.links.findById(id), userId);
  }
}

@Injectable()
export class ListTags {
  constructor(private readonly links: LinkRepository) {}
  execute(userId: string) {
    return this.links.listTags(userId);
  }
}

export interface UpdateLinkInput {
  id: number;
  userId: string;
  changes: {
    originalUrl?: string | null;
    expiresAt?: string | null;
    maxClicks?: number | null;
    password?: string | null;
    isActive?: boolean;
    tags?: string[];
  };
}

@Injectable()
export class UpdateLink {
  constructor(
    private readonly links: LinkRepository,
    private readonly cache: LinkCache,
    private readonly hasher: PasswordHasher,
    private readonly safety: UrlSafetyChecker,
  ) {}

  async execute({ id, userId, changes }: UpdateLinkInput): Promise<Link> {
    const link = assertOwner(await this.links.findById(id), userId);
    const data: UpdateLinkData = {};

    if (changes.originalUrl) {
      const url = OriginalUrl.create(changes.originalUrl);
      if (!(await this.safety.isSafe(url.value))) throw new DomainError('validation', 'This URL is not allowed');
      data.originalUrl = url.value;
    }
    if (changes.expiresAt !== undefined) data.expiresAt = parseFutureDate(changes.expiresAt);
    if (changes.maxClicks !== undefined) data.maxClicks = changes.maxClicks;
    if (changes.isActive !== undefined) data.isActive = changes.isActive;
    if (changes.tags !== undefined) data.tags = normalizeTags(changes.tags);
    if (changes.password !== undefined) {
      data.passwordHash = changes.password ? await this.hasher.hash(changes.password) : null;
    }

    const updated = await this.links.update(id, userId, data);
    await this.cache.invalidate(link.shortCode);
    return updated;
  }
}

@Injectable()
export class DeleteLinks {
  constructor(
    private readonly links: LinkRepository,
    private readonly cache: LinkCache,
  ) {}

  async execute(ids: number[], userId: string): Promise<number> {
    const codes = await this.links.deleteMany(ids, userId);
    await Promise.all(codes.map((c) => this.cache.invalidate(c)));
    return codes.length;
  }
}

export interface BulkResult {
  url: string;
  link?: Link;
  error?: string;
}

@Injectable()
export class BulkCreateLinks {
  constructor(private readonly create: CreateShortLink) {}

  async execute(urls: string[], userId: string): Promise<BulkResult[]> {
    const results: BulkResult[] = [];
    for (const url of urls) {
      try {
        results.push({ url, link: await this.create.execute({ url, userId }) });
      } catch (e) {
        results.push({ url, error: e instanceof Error ? e.message : 'Failed' });
      }
    }
    return results;
  }
}
