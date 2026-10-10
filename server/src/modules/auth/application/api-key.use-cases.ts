import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/errors';
import { sha256 } from '../../../shared/domain/hash.util';
import { ApiKeyRepository } from '../domain/api-key.repository';

@Injectable()
export class CreateApiKey {
  constructor(private readonly keys: ApiKeyRepository) {}

  /** The raw key is returned once and never stored. */
  async execute(userId: string, name: string) {
    const rawKey = `sk_${randomBytes(24).toString('base64url')}`;
    const record = await this.keys.create({ userId, name, prefix: rawKey.slice(0, 8), keyHash: sha256(rawKey) });
    return { ...record, key: rawKey };
  }
}

@Injectable()
export class ListApiKeys {
  constructor(private readonly keys: ApiKeyRepository) {}
  execute(userId: string) {
    return this.keys.listByUser(userId);
  }
}

@Injectable()
export class RevokeApiKey {
  constructor(private readonly keys: ApiKeyRepository) {}
  async execute(id: string, userId: string) {
    if (!(await this.keys.delete(id, userId))) throw new DomainError('not_found', 'API key not found');
  }
}
