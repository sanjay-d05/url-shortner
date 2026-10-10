import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { AnalyticsRepository, Bucket, DayPoint, LinkAnalytics, UserSummary } from '../domain/analytics.repository';

type BucketColumn = 'country' | 'device' | 'browser' | 'os' | 'referrer';

@Injectable()
export class PrismaAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // `column` is restricted by the type above, so interpolating it is safe.
  private breakdown(column: BucketColumn, linkId: number, since: Date): Promise<Bucket[]> {
    return this.prisma.$queryRawUnsafe<Bucket[]>(
      `SELECT "${column}" AS name, COUNT(*)::int AS value
       FROM "ClickEvent" WHERE "linkId" = $1 AND "clickedAt" >= $2
       GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
      linkId,
      since,
    );
  }

  async linkAnalytics(linkId: number, since: Date): Promise<LinkAnalytics> {
    const [totals, timeSeries, countries, devices, browsers, operatingSystems, referrers] = await Promise.all([
      this.prisma.$queryRaw<{ total: number; unique: number }[]>`
        SELECT COUNT(*)::int AS total, COUNT(DISTINCT "visitorHash")::int AS unique
        FROM "ClickEvent" WHERE "linkId" = ${linkId} AND "clickedAt" >= ${since}`,
      this.prisma.$queryRaw<DayPoint[]>`
        SELECT to_char(date_trunc('day', "clickedAt"), 'YYYY-MM-DD') AS date, COUNT(*)::int AS clicks
        FROM "ClickEvent" WHERE "linkId" = ${linkId} AND "clickedAt" >= ${since}
        GROUP BY 1 ORDER BY 1`,
      this.breakdown('country', linkId, since),
      this.breakdown('device', linkId, since),
      this.breakdown('browser', linkId, since),
      this.breakdown('os', linkId, since),
      this.breakdown('referrer', linkId, since),
    ]);
    return {
      totalClicks: totals[0]?.total ?? 0,
      uniqueVisitors: totals[0]?.unique ?? 0,
      timeSeries, countries, devices, browsers, operatingSystems, referrers,
    };
  }

  async userSummary(userId: string, since: Date): Promise<UserSummary> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalLinks, sums, timeSeries, week, topLinks] = await Promise.all([
      this.prisma.link.count({ where: { userId } }),
      this.prisma.link.aggregate({ where: { userId }, _sum: { clickCount: true } }),
      this.prisma.$queryRaw<DayPoint[]>`
        SELECT to_char(date_trunc('day', c."clickedAt"), 'YYYY-MM-DD') AS date, COUNT(*)::int AS clicks
        FROM "ClickEvent" c JOIN "Link" l ON l."id" = c."linkId"
        WHERE l."userId" = ${userId} AND c."clickedAt" >= ${since}
        GROUP BY 1 ORDER BY 1`,
      this.prisma.clickEvent.count({ where: { clickedAt: { gte: weekAgo }, link: { userId } } }),
      this.prisma.link.findMany({
        where: { userId },
        orderBy: { clickCount: 'desc' },
        take: 5,
        select: { id: true, shortCode: true, originalUrl: true, clickCount: true },
      }),
    ]);
    return {
      totalLinks,
      totalClicks: sums._sum.clickCount ?? 0,
      clicksLast7Days: week,
      timeSeries,
      topLinks,
    };
  }
}
