import {
  Body, Controller, Delete, Get, HttpCode, Param, Post, Req, Res, UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { DomainError } from '../../../shared/domain/errors';
import { CreateApiKey, ListApiKeys, RevokeApiKey } from '../application/api-key.use-cases';
import { AuthResult, LoginUser, LogoutUser, RefreshSession, RegisterUser } from '../application/auth.use-cases';
import { AuthUser } from '../domain/user.entity';
import { AuthGuard, CurrentUser } from './auth.guard';
import { CreateApiKeyDto, LoginDto, RegisterDto } from './dto/auth.dto';

const COOKIE = 'refresh_token';
const strict = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  private readonly isProd: boolean;

  constructor(
    config: ConfigService,
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
    private readonly refreshSession: RefreshSession,
    private readonly logoutUser: LogoutUser,
  ) {
    this.isProd = config.get('NODE_ENV') === 'production';
  }

  private respond(res: Response, result: AuthResult) {
    res.cookie(COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: this.isProd ? 'none' : 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('register') @Throttle(strict)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.registerUser.execute(dto.email, dto.password));
  }

  @Post('login') @HttpCode(200) @Throttle(strict)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.loginUser.execute(dto.email, dto.password));
  }

  @Post('refresh') @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[COOKIE];
    if (!token) throw new DomainError('unauthorized', 'No session');
    return this.respond(res, await this.refreshSession.execute(token));
  }

  @Post('logout') @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.logoutUser.execute(req.cookies?.[COOKIE]);
    res.clearCookie(COOKIE, { path: '/api/auth' });
    return { ok: true };
  }

  @Get('me') @ApiBearerAuth() @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }
}

@ApiTags('api-keys')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(AuthGuard)
@Controller('api/api-keys')
export class ApiKeysController {
  constructor(
    private readonly createKey: CreateApiKey,
    private readonly listKeys: ListApiKeys,
    private readonly revokeKey: RevokeApiKey,
  ) {}

  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateApiKeyDto) {
    return this.createKey.execute(user.id, dto.name);
  }

  @Get() list(@CurrentUser() user: AuthUser) {
    return this.listKeys.execute(user.id);
  }

  @Delete(':id') @HttpCode(204)
  async revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.revokeKey.execute(id, user.id);
  }
}
