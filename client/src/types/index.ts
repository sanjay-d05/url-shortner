export interface User { id: string; email: string; role: string }

export type LinkStatus = 'active' | 'disabled' | 'expired' | 'limit_reached';

export interface Link {
  id: number;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  maxClicks: number | null;
  expiresAt: string | null;
  isActive: boolean;
  isPasswordProtected: boolean;
  status: LinkStatus;
  tags: string[];
  createdAt: string;
}

export interface Paginated<T> { items: T[]; total: number; page: number; pageSize: number }
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
  days: number;
}

export interface Summary {
  totalLinks: number;
  totalClicks: number;
  clicksLast7Days: number;
  timeSeries: DayPoint[];
  topLinks: { id: number; shortCode: string; originalUrl: string; clickCount: number }[];
  days: number;
}

export interface ApiKey { id: string; name: string; prefix: string; createdAt: string; key?: string }
export interface BulkResult { url: string; link?: Link; error?: string }
