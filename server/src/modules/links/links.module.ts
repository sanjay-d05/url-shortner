import { Module } from '@nestjs/common';
import { CreateShortLink } from './application/create-short-link';
import {
  BulkCreateLinks, DeleteLinks, GetOwnedLink, ListLinks, ListTags, UpdateLink,
} from './application/manage-links';
import { RecordClick } from './application/record-click';
import { ResolveShortLink } from './application/resolve-short-link';
import { ClickRepository } from './domain/click.repository';
import { LinkCache } from './domain/link-cache';
import { LinkRepository } from './domain/link.repository';
import { QrGenerator } from './domain/qr-generator';
import { UrlSafetyChecker } from './domain/url-safety-checker';
import { PrismaClickRepository } from './infrastructure/prisma-click.repository';
import { PrismaLinkRepository } from './infrastructure/prisma-link.repository';
import { QrCodeGenerator } from './infrastructure/qrcode.generator';
import { RedisLinkCache } from './infrastructure/redis-link.cache';
import { SafeBrowsingChecker } from './infrastructure/safe-browsing.checker';
import { LinksController } from './presentation/links.controller';
import { PublicLinksController, RedirectController } from './presentation/redirect.controller';

@Module({
  controllers: [LinksController, PublicLinksController, RedirectController],
  providers: [
    // infrastructure bound to domain interfaces
    { provide: LinkRepository, useClass: PrismaLinkRepository },
    { provide: ClickRepository, useClass: PrismaClickRepository },
    { provide: LinkCache, useClass: RedisLinkCache },
    { provide: QrGenerator, useClass: QrCodeGenerator },
    { provide: UrlSafetyChecker, useClass: SafeBrowsingChecker },
    // use cases
    CreateShortLink, ResolveShortLink, RecordClick,
    ListLinks, GetOwnedLink, ListTags, UpdateLink, DeleteLinks, BulkCreateLinks,
  ],
  exports: [GetOwnedLink],
})
export class LinksModule {}
