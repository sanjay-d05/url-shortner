import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { ApiKeyRepository } from '../domain/api-key.repository';

const select = { id: true, name: true, prefix: true, createdAt: true } as const;

@Injectable()
export class PrismaApiKeyRepository implements ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { userId: string; name: string; prefix: string; keyHash: string }) {
    return this.prisma.apiKey.create({ data, select });
  }
  listByUser(userId: string) {
    return this.prisma.apiKey.findMany({ where: { userId }, select, orderBy: { createdAt: 'desc' } });
  }
  async delete(id: string, userId: string) {
    const { count } = await this.prisma.apiKey.deleteMany({ where: { id, userId } });
    return count > 0;
  }
  async findUserByHash(keyHash: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { keyHash }, include: { user: true } });
    return key ? { id: key.user.id, email: key.user.email, role: key.user.role } : null;
  }
}
