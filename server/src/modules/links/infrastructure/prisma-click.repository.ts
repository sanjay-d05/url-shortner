import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { ClickData, ClickRepository } from '../domain/click.repository';

@Injectable()
export class PrismaClickRepository implements ClickRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(data: ClickData) {
    await this.prisma.clickEvent.create({ data });
  }
}
