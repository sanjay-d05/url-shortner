import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors';
import { sha256 } from '../../../shared/domain/hash.util';
import { PasswordHasher } from '../../../shared/domain/password-hasher';
import { TokenService } from '../domain/token.service';
import { AuthUser, User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class IssueSession {
  constructor(
    private readonly tokens: TokenService,
    private readonly users: UserRepository,
  ) {}

  async execute(user: User): Promise<AuthResult> {
    const authUser: AuthUser = { id: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccess(authUser),
      this.tokens.signRefresh(user.id),
    ]);
    // Only a hash of the refresh token is stored, so a DB leak can't be replayed.
    await this.users.setRefreshTokenHash(user.id, sha256(refreshToken));
    return { user: authUser, accessToken, refreshToken };
  }
}

@Injectable()
export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly session: IssueSession,
  ) {}

  async execute(email: string, password: string): Promise<AuthResult> {
    const normalized = email.trim().toLowerCase();
    if (await this.users.findByEmail(normalized)) {
      throw new DomainError('conflict', 'An account with this email already exists');
    }
    const user = await this.users.create({ email: normalized, passwordHash: await this.hasher.hash(password) });
    return this.session.execute(user);
  }
}

@Injectable()
export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly session: IssueSession,
  ) {}

  async execute(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    const valid = user && (await this.hasher.compare(password, user.passwordHash));
    if (!user || !valid) throw new DomainError('unauthorized', 'Invalid email or password');
    return this.session.execute(user);
  }
}

@Injectable()
export class RefreshSession {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenService,
    private readonly session: IssueSession,
  ) {}

  async execute(refreshToken: string): Promise<AuthResult> {
    const payload = await this.tokens.verifyRefresh(refreshToken);
    const user = payload ? await this.users.findById(payload.sub) : null;
    if (!user || user.refreshTokenHash !== sha256(refreshToken)) {
      throw new DomainError('unauthorized', 'Session expired, please sign in again');
    }
    return this.session.execute(user); // rotates the refresh token
  }
}

@Injectable()
export class LogoutUser {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(refreshToken?: string): Promise<void> {
    const payload = refreshToken ? await this.tokens.verifyRefresh(refreshToken) : null;
    if (payload) await this.users.setRefreshTokenHash(payload.sub, null);
  }
}
