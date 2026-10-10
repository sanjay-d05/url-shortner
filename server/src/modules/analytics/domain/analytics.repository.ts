export interface Bucket { name: string; value: number }
export interface DayPoint { date: string; clicks: number }

export interface LinkAnalytics {
  totalClicks: number;
  uniqueVisitors: number;
  timeSeries: DayPoint[];
  countries: Bucket[];
  devices: Bucket[];
  browsers: Bucket[];
  operatingSystems: Bucket[];
  referrers: Bucket[];
}

export interface UserSummary {
  totalLinks: number;
  totalClicks: number;
  clicksLast7Days: number;
  timeSeries: DayPoint[];
  topLinks: { id: number; shortCode: string; originalUrl: string; clickCount: number }[];
}

export abstract class AnalyticsRepository {
  abstract linkAnalytics(linkId: number, since: Date): Promise<LinkAnalytics>;
  abstract userSummary(userId: string, since: Date): Promise<UserSummary>;
}
