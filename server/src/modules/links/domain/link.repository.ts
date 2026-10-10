import { Link } from './link.entity';

export interface CreateLinkData {
  shortCode: string;
  originalUrl: string;
  userId: string | null;
  expiresAt: Date | null;
  maxClicks: number | null;
  passwordHash: string | null;
  tags: string[];
}

export interface UpdateLinkData {
  originalUrl?: string;
  expiresAt?: Date | null;
  maxClicks?: number | null;
  passwordHash?: string | null;
  isActive?: boolean;
  tags?: string[];
}

export interface ListLinksQuery {
  userId: string;
  search?: string;
  tag?: string;
  status?: 'active' | 'disabled' | 'expired';
  page: number;
  pageSize: number;
}

export abstract class LinkRepository {
  /** Must throw DomainError('conflict') when the short code already exists. */
  abstract create(data: CreateLinkData): Promise<Link>;
  abstract findByCode(code: string): Promise<Link | null>;
  abstract findById(id: number): Promise<Link | null>;
  abstract list(query: ListLinksQuery): Promise<{ items: Link[]; total: number }>;
  abstract update(id: number, userId: string, data: UpdateLinkData): Promise<Link>;
  /** Deletes the user's links and returns their short codes (for cache invalidation). */
  abstract deleteMany(ids: number[], userId: string): Promise<string[]>;
  /** Atomically increments the click count unless the click limit is reached. */
  abstract consumeClick(id: number): Promise<boolean>;
  abstract incrementClicks(id: number): Promise<void>;
  abstract listTags(userId: string): Promise<string[]>;
}
