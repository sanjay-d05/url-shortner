import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { AuthUser } from '../../auth/domain/user.entity';
import { AuthGuard, CurrentUser } from '../../auth/presentation/auth.guard';
import { GetLinkAnalytics, GetUserSummary } from '../application/analytics.use-cases';

class RangeQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365)
  days: number = 30;
}

@ApiTags('analytics')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(AuthGuard)
@Controller()
export class AnalyticsController {
  constructor(
    private readonly linkAnalytics: GetLinkAnalytics,
    private readonly userSummary: GetUserSummary,
  ) {}

  @Get('api/links/:id/analytics')
  forLink(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Query() q: RangeQuery) {
    return this.linkAnalytics.execute(id, user.id, q.days);
  }

  @Get('api/analytics/summary')
  summary(@CurrentUser() user: AuthUser, @Query() q: RangeQuery) {
    return this.userSummary.execute(user.id, Math.min(q.days, 90));
  }
}
