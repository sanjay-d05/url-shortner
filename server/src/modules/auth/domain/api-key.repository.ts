import { AuthUser } from './user.entity';

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
}

export abstract class ApiKeyRepository {
  abstract create(data: { userId: string; name: string; prefix: string; keyHash: string }): Promise<ApiKeyRecord>;
  abstract listByUser(userId: string): Promise<ApiKeyRecord[]>;
  abstract delete(id: string, userId: string): Promise<boolean>;
  abstract findUserByHash(keyHash: string): Promise<AuthUser | null>;
}
