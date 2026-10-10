import { randomBytes } from 'crypto';
import { DomainError } from '../../../shared/domain/errors';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Paths used by the frontend or API; an alias must never shadow them.
const RESERVED = new Set([
  'api', 'login', 'register', 'dashboard', 'links', 'settings',
  'protected', 'link-unavailable', 'favicon.ico', 'robots.txt', '_next',
]);

export class ShortCode {
  private static readonly PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

  private constructor(readonly value: string) {}

  /** Random base62 code (62^7 ≈ 3.5 trillion combinations, not guessable in sequence). */
  static generate(length = 7): ShortCode {
    const bytes = randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) out += BASE62[bytes[i] % 62];
    return new ShortCode(out);
  }

  static create(raw: string): ShortCode {
    const value = raw.trim();
    if (!ShortCode.PATTERN.test(value)) {
      throw new DomainError('validation', 'Alias must be 3-32 characters: letters, numbers, - or _');
    }
    if (RESERVED.has(value.toLowerCase())) {
      throw new DomainError('validation', 'This alias is reserved');
    }
    return new ShortCode(value);
  }
}
