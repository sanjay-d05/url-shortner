import { AuthUser } from './user.entity';

export abstract class TokenService {
  abstract signAccess(user: AuthUser): Promise<string>;
  abstract signRefresh(userId: string): Promise<string>;
  abstract verifyAccess(token: string): Promise<AuthUser | null>;
  abstract verifyRefresh(token: string): Promise<{ sub: string } | null>;
}
