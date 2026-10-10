import { DomainError } from '../../../shared/domain/errors';

export class OriginalUrl {
  private constructor(readonly value: string) {}

  static create(raw: string): OriginalUrl {
    const input = (raw ?? '').trim();
    if (!input || input.length > 2048) {
      throw new DomainError('validation', 'URL is empty or too long (max 2048 characters)');
    }
    let parsed: URL;
    try {
      parsed = new URL(input);
    } catch {
      throw new DomainError('validation', 'Invalid URL. Include http:// or https://');
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new DomainError('validation', 'Only http and https URLs are allowed');
    }
    return new OriginalUrl(parsed.toString());
  }
}
