import { Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/domain/hash.util';
import { ClickRepository } from '../domain/click.repository';
import { Link } from '../domain/link.entity';
import { LinkRepository } from '../domain/link.repository';
import { parseUserAgent } from '../domain/user-agent';

export interface RecordClickInput {
  link: Link;
  ip: string;
  userAgent: string;
  referrer?: string;
  country?: string;
}

@Injectable()
export class RecordClick {
  constructor(
    private readonly clicks: ClickRepository,
    private readonly links: LinkRepository,
  ) {}

  async execute({ link, ip, userAgent, referrer, country }: RecordClickInput): Promise<void> {
    const ua = parseUserAgent(userAgent);
    if (ua.isBot) return; // bots are not counted in analytics

    // Limited links already had their counter incremented atomically during resolve.
    if (link.maxClicks === null) await this.links.incrementClicks(link.id);

    // Privacy-friendly unique visitor id: salted with the date, so it can't track people across days.
    const day = new Date().toISOString().slice(0, 10);
    const visitorHash = sha256(`${ip}|${userAgent}|${link.id}|${day}`).slice(0, 32);

    await this.clicks.record({
      linkId: link.id,
      country: country || 'Unknown',
      device: ua.device,
      browser: ua.browser,
      os: ua.os,
      referrer: referrerHost(referrer),
      visitorHash,
    });
  }
}

function referrerHost(referrer?: string): string {
  if (!referrer) return 'Direct';
  try {
    return new URL(referrer).hostname.replace(/^www\./, '') || 'Direct';
  } catch {
    return 'Direct';
  }
}
