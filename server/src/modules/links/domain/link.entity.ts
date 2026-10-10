export interface LinkProps {
  id: number;
  shortCode: string;
  originalUrl: string;
  userId: string | null;
  expiresAt: Date | null;
  maxClicks: number | null;
  clickCount: number;
  passwordHash: string | null;
  isActive: boolean;
  createdAt: Date;
  tags: string[];
}

export type LinkStatus = 'active' | 'disabled' | 'expired' | 'limit_reached';

// Declaration merging: the class exposes every LinkProps field directly.
export interface Link extends LinkProps {}
export class Link {
  constructor(props: LinkProps) {
    Object.assign(this, props);
  }

  get isPasswordProtected(): boolean {
    return this.passwordHash !== null;
  }

  isExpired(now = new Date()): boolean {
    return this.expiresAt !== null && this.expiresAt.getTime() <= now.getTime();
  }

  isClickLimitReached(): boolean {
    return this.maxClicks !== null && this.clickCount >= this.maxClicks;
  }

  status(now = new Date()): LinkStatus {
    if (!this.isActive) return 'disabled';
    if (this.isExpired(now)) return 'expired';
    if (this.isClickLimitReached()) return 'limit_reached';
    return 'active';
  }
}
