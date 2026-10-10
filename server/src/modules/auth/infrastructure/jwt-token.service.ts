import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../domain/token.service';
import { AuthUser } from '../domain/user.entity';

@Injectable()
export class JwtTokenService implements TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  signAccess(user: AuthUser) {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: this.accessSecret, expiresIn: '15m' },
    );
  }

  signRefresh(userId: string) {
    // `jti` guarantees a different token on every rotation, even within the same second.
    return this.jwt.signAsync(
      { sub: userId, jti: Math.random().toString(36).slice(2) },
      { secret: this.refreshSecret, expiresIn: '7d' },
    );
  }

  async verifyAccess(token: string): Promise<AuthUser | null> {
    try {
      const p = await this.jwt.verifyAsync(token, { secret: this.accessSecret });
      return { id: p.sub, email: p.email, role: p.role };
    } catch {
      return null;
    }
  }

  async verifyRefresh(token: string) {
    try {
      const p = await this.jwt.verifyAsync(token, { secret: this.refreshSecret });
      return { sub: p.sub as string };
    } catch {
      return null;
    }
  }
}
