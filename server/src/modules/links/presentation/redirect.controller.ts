import { Body, Controller, Get, HttpCode, Logger, Param, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { DomainError } from '../../../shared/domain/errors';
import { RecordClick } from '../application/record-click';
import { ResolveShortLink } from '../application/resolve-short-link';
import { Link } from '../domain/link.entity';
import { UnlockDto } from './dto/link.dto';

abstract class ClickTracking {
  protected readonly logger = new Logger('ClickTracking');
  constructor(protected readonly recordClick: RecordClick) {}

  /** Fire-and-forget: logging a click must never slow down or break the redirect. */
  protected track(link: Link, req: Request) {
    const header = (name: string) => {
      const v = req.headers[name];
      return Array.isArray(v) ? v[0] : v;
    };
    this.recordClick
      .execute({
        link,
        ip: req.ip ?? '',
        userAgent: header('user-agent') ?? '',
        referrer: header('referer'),
        country: header('cf-ipcountry') ?? header('x-vercel-ip-country'),
      })
      .catch((e: Error) => this.logger.warn(`Failed to record click: ${e.message}`));
  }
}

/** GET /:code  ->  302 to the original URL (or to a frontend page for edge cases). */
@ApiExcludeController()
@SkipThrottle()
@Controller()
export class RedirectController extends ClickTracking {
  private readonly frontendUrl: string;

  constructor(
    config: ConfigService,
    private readonly resolve: ResolveShortLink,
    recordClick: RecordClick,
  ) {
    super(recordClick);
    this.frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000').replace(/\/$/, '');
  }

  @Get(':code')
  async redirect(@Param('code') code: string, @Req() req: Request, @Res() res: Response) {
    const result = await this.resolve.execute(code);
    // 302 (not 301) so browsers never cache the redirect and every click is counted.
    res.setHeader('Cache-Control', 'no-store');

    switch (result.status) {
      case 'ok':
        this.track(result.link, req);
        return res.redirect(302, result.url);
      case 'password_required':
      case 'wrong_password':
        return res.redirect(302, `${this.frontendUrl}/protected/${encodeURIComponent(code)}`);
      case 'unavailable':
        return res.redirect(302, `${this.frontendUrl}/link-unavailable?reason=${result.reason}`);
    }
  }
}

/** Used by the frontend password page. */
@Controller('api/public')
export class PublicLinksController extends ClickTracking {
  constructor(
    private readonly resolve: ResolveShortLink,
    recordClick: RecordClick,
  ) {
    super(recordClick);
  }

  @Post('unlock/:code') @HttpCode(200) @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async unlock(@Param('code') code: string, @Body() dto: UnlockDto, @Req() req: Request) {
    const result = await this.resolve.execute(code, dto.password);
    switch (result.status) {
      case 'ok':
        this.track(result.link, req);
        return { url: result.url };
      case 'password_required':
      case 'wrong_password':
        throw new DomainError('forbidden', 'Incorrect password');
      case 'unavailable':
        throw new DomainError(result.reason === 'not_found' ? 'not_found' : 'gone', `Link unavailable (${result.reason})`);
    }
  }
}
