import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UrlSafetyChecker } from '../domain/url-safety-checker';

/**
 * 1. Blocks links that point back to this service (redirect loops).
 * 2. If SAFE_BROWSING_API_KEY is set, checks Google Safe Browsing. Fails open on network errors.
 */
@Injectable()
export class SafeBrowsingChecker implements UrlSafetyChecker {
  private readonly logger = new Logger(SafeBrowsingChecker.name);
  private readonly selfHost: string;
  private readonly apiKey?: string;

  constructor(config: ConfigService) {
    this.selfHost = new URL(config.get<string>('BASE_URL', 'http://localhost:4000')).host;
    this.apiKey = config.get<string>('SAFE_BROWSING_API_KEY') || undefined;
  }

  async isSafe(url: string): Promise<boolean> {
    if (new URL(url).host === this.selfHost) return false;
    if (!this.apiKey) return true;

    try {
      const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'url-shortener', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
        signal: AbortSignal.timeout(3000),
      });
      const body = (await res.json()) as { matches?: unknown[] };
      return !body.matches?.length;
    } catch (e) {
      this.logger.warn(`Safe Browsing check failed, allowing URL: ${(e as Error).message}`);
      return true;
    }
  }
}
