import { Injectable } from '@nestjs/common';
import { GetOwnedLink } from '../../links/application/manage-links';
import { AnalyticsRepository, DayPoint } from '../domain/analytics.repository';

const DAY = 24 * 60 * 60 * 1000;

/** Returns midnight UTC `days` days ago (inclusive of today). */
export function startOfRange(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - (days - 1) * DAY);
}

/** Fills days with zero clicks so charts have a continuous x-axis. */
export function fillDays(points: DayPoint[], since: Date, days: number): DayPoint[] {
  const map = new Map(points.map((p) => [p.date, p.clicks]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    return { date, clicks: map.get(date) ?? 0 };
  });
}

@Injectable()
export class GetLinkAnalytics {
  constructor(
    private readonly links: GetOwnedLink,
    private readonly analytics: AnalyticsRepository,
  ) {}

  async execute(linkId: number, userId: string, days: number) {
    await this.links.execute(linkId, userId); // ownership check
    const since = startOfRange(days);
    const data = await this.analytics.linkAnalytics(linkId, since);
    return { ...data, timeSeries: fillDays(data.timeSeries, since, days), days };
  }
}

@Injectable()
export class GetUserSummary {
  constructor(private readonly analytics: AnalyticsRepository) {}

  async execute(userId: string, days: number) {
    const since = startOfRange(days);
    const data = await this.analytics.userSummary(userId, since);
    return { ...data, timeSeries: fillDays(data.timeSeries, since, days), days };
  }
}
