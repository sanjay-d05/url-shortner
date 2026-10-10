import { User } from './user.entity';

export abstract class UserRepository {
  abstract create(data: { email: string; passwordHash: string }): Promise<User>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract setRefreshTokenHash(id: string, hash: string | null): Promise<void>;
}
