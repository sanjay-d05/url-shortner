import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { sha256 } from '../../../shared/domain/hash.util';
import { ApiKeyRepository } from '../domain/api-key.repository';
import { TokenService } from '../domain/token.service';
import { AuthUser } from '../domain/user.entity';

export type AuthedRequest = Request & { user?: AuthUser };

/** Accepts `Authorization: Bearer <jwt>` (dashboard) or `x-api-key: sk_...` (API clients). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    protected readonly tokens: TokenService,
    protected readonly apiKeys: ApiKeyRepository,
  ) {}

  protected async authenticate(req: Request): Promise<AuthUser | null> {
    const apiKey = req.headers['x-api-key'];
    if (typeof apiKey === 'string' && apiKey) {
      return this.apiKeys.findUserByHash(sha256(apiKey));
    }
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return this.tokens.verifyAccess(header.slice(7));
    }
    return null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const user = await this.authenticate(req);
    if (!user) throw new UnauthorizedException();
    req.user = user;
    return true;
  }
}

/** Lets anonymous visitors through (req.user stays undefined), e.g. the landing page shortener. */
@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    req.user = (await this.authenticate(req)) ?? undefined;
    return true;
  }
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser | undefined => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user;
});
