import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { UserRepository } from '../domain/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { email: string; passwordHash: string }) {
    return this.prisma.user.create({ data });
  }
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  async setRefreshTokenHash(id: string, hash: string | null) {
    await this.prisma.user.update({ where: { id }, data: { refreshTokenHash: hash } });
  }
}
