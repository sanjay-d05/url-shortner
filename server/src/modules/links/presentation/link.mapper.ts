import { Link } from '../domain/link.entity';

export function toLinkResponse(link: Link, baseUrl: string) {
  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `${baseUrl.replace(/\/$/, '')}/${link.shortCode}`,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount,
    maxClicks: link.maxClicks,
    expiresAt: link.expiresAt,
    isActive: link.isActive,
    isPasswordProtected: link.isPasswordProtected,
    status: link.status(),
    tags: link.tags,
    createdAt: link.createdAt,
  };
}
