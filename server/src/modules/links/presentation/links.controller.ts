import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser } from '../../auth/domain/user.entity';
import { AuthGuard, CurrentUser, OptionalAuthGuard } from '../../auth/presentation/auth.guard';
import { CreateShortLink } from '../application/create-short-link';
import {
  BulkCreateLinks, DeleteLinks, GetOwnedLink, ListLinks, ListTags, UpdateLink,
} from '../application/manage-links';
import { QrGenerator } from '../domain/qr-generator';
import {
  BulkCreateDto, BulkDeleteDto, CreateLinkDto, ListLinksQueryDto, UpdateLinkDto,
} from './dto/link.dto';
import { toLinkResponse } from './link.mapper';

@ApiTags('links')
@ApiBearerAuth()
@ApiSecurity('api-key')
@Controller('api/links')
export class LinksController {
  private readonly baseUrl: string;

  constructor(
    config: ConfigService,
    private readonly createLink: CreateShortLink,
    private readonly listLinks: ListLinks,
    private readonly getLink: GetOwnedLink,
    private readonly updateLink: UpdateLink,
    private readonly deleteLinks: DeleteLinks,
    private readonly bulkCreate: BulkCreateLinks,
    private readonly listTags: ListTags,
    private readonly qr: QrGenerator,
  ) {
    this.baseUrl = config.get<string>('BASE_URL', 'http://localhost:4000');
  }

  /** Anonymous visitors may shorten a plain URL; advanced options need an account. */
  @Post() @UseGuards(OptionalAuthGuard) @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async create(@CurrentUser() user: AuthUser | undefined, @Body() dto: CreateLinkDto) {
    const link = await this.createLink.execute({ ...dto, userId: user?.id ?? null });
    return toLinkResponse(link, this.baseUrl);
  }

  @Post('bulk') @HttpCode(200) @UseGuards(AuthGuard) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async bulk(@CurrentUser() user: AuthUser, @Body() dto: BulkCreateDto) {
    const results = await this.bulkCreate.execute(dto.urls, user.id);
    return results.map((r) => ({
      url: r.url,
      error: r.error,
      link: r.link ? toLinkResponse(r.link, this.baseUrl) : undefined,
    }));
  }

  @Post('bulk-delete') @HttpCode(200) @UseGuards(AuthGuard)
  async bulkDelete(@CurrentUser() user: AuthUser, @Body() dto: BulkDeleteDto) {
    return { deleted: await this.deleteLinks.execute(dto.ids, user.id) };
  }

  @Get() @UseGuards(AuthGuard)
  async list(@CurrentUser() user: AuthUser, @Query() query: ListLinksQueryDto) {
    const { items, total } = await this.listLinks.execute({ ...query, userId: user.id });
    return {
      items: items.map((l) => toLinkResponse(l, this.baseUrl)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  @Get('tags') @UseGuards(AuthGuard)
  tags(@CurrentUser() user: AuthUser) {
    return this.listTags.execute(user.id);
  }

  @Get(':id') @UseGuards(AuthGuard)
  async get(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return toLinkResponse(await this.getLink.execute(id, user.id), this.baseUrl);
  }

  @Patch(':id') @UseGuards(AuthGuard)
  async update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLinkDto) {
    const { url, ...rest } = dto;
    const link = await this.updateLink.execute({ id, userId: user.id, changes: { ...rest, originalUrl: url } });
    return toLinkResponse(link, this.baseUrl);
  }

  @Delete(':id') @HttpCode(204) @UseGuards(AuthGuard)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.deleteLinks.execute([id], user.id);
  }

  @Get(':id/qr') @UseGuards(AuthGuard)
  async qrCode(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    const link = await this.getLink.execute(id, user.id);
    const { shortUrl } = toLinkResponse(link, this.baseUrl);
    return { dataUrl: await this.qr.toDataUrl(shortUrl) };
  }
}
