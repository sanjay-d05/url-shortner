import { DomainError } from '../../../shared/domain/errors';
import { Link } from './link.entity';

export function parseFutureDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new DomainError('validation', 'Invalid expiry date');
  if (date.getTime() <= Date.now()) throw new DomainError('validation', 'Expiry must be in the future');
  return date;
}

export function normalizeTags(tags: string[] | undefined): string[] {
  const cleaned = (tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const unique = [...new Set(cleaned)];
  if (unique.some((t) => t.length > 30)) throw new DomainError('validation', 'Tags must be 30 characters or fewer');
  return unique.slice(0, 10);
}

/** Returns a "not found" for links owned by someone else so ids can't be probed. */
export function assertOwner(link: Link | null, userId: string): Link {
  if (!link || link.userId !== userId) throw new DomainError('not_found', 'Link not found');
  return link;
}
