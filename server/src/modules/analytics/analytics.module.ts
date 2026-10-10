import { Module } from '@nestjs/common';
import { LinksModule } from '../links/links.module';
import { GetLinkAnalytics, GetUserSummary } from './application/analytics.use-cases';
import { AnalyticsRepository } from './domain/analytics.repository';
import { PrismaAnalyticsRepository } from './infrastructure/prisma-analytics.repository';
import { AnalyticsController } from './presentation/analytics.controller';

@Module({
  imports: [LinksModule],
  controllers: [AnalyticsController],
  providers: [{ provide: AnalyticsRepository, useClass: PrismaAnalyticsRepository }, GetLinkAnalytics, GetUserSummary],
})
export class AnalyticsModule {}
