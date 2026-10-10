import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainError } from '../../../shared/domain/errors';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { Link } from '../domain/link.entity';
import {
  CreateLinkData,
  LinkRepository,
  ListLinksQuery,
  UpdateLinkData,
} from '../domain/link.repository';

type Row = Prisma.LinkGetPayload<{ include: { tags: true } }>;

const toEntity = (row: Row): Link =>
  new Link({
    id: row.id,
    shortCode: row.shortCode,
    originalUrl: row.originalUrl,
    userId: row.userId,
    expiresAt: row.expiresAt,
    maxClicks: row.maxClicks,
    clickCount: row.clickCount,
    passwordHash: row.passwordHash,
    isActive: row.isActive,
    createdAt: row.createdAt,
    tags: row.tags.map((t) => t.name),
  });

const connectTags = (userId: string, tags: string[]) =>
  tags.map((name) => ({ where: { userId_name: { userId, name } }, create: { name, userId } }));

@Injectable()
export class PrismaLinkRepository implements LinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLinkData): Promise<Link> {
    try {
      const row = await this.prisma.link.create({
        data: {
          shortCode: data.shortCode,
          originalUrl: data.originalUrl,
          userId: data.userId,
          expiresAt: data.expiresAt,
          maxClicks: data.maxClicks,
          passwordHash: data.passwordHash,
          tags:
            data.userId && data.tags.length
              ? { connectOrCreate: connectTags(data.userId, data.tags) }
              : undefined,
        },
        include: { tags: true },
      });
      return toEntity(row);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new DomainError('conflict', 'That short code is already taken');
      }
      throw e;
    }
  }

  async findByCode(code: string) {
    const row = await this.prisma.link.findUnique({ where: { shortCode: code }, include: { tags: true } });
    return row ? toEntity(row) : null;
  }

  async findById(id: number) {
    const row = await this.prisma.link.findUnique({ where: { id }, include: { tags: true } });
    return row ? toEntity(row) : null;
  }

  async list(q: ListLinksQuery) {
    const now = new Date();
    const where: Prisma.LinkWhereInput = { userId: q.userId };
    if (q.search) {
      where.OR = [
        { originalUrl: { contains: q.search, mode: 'insensitive' } },
        { shortCode: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.tag) where.tags = { some: { name: q.tag } };
    if (q.status === 'active') {
      where.isActive = true;
      where.AND = [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }];
    } else if (q.status === 'disabled') {
      where.isActive = false;
    } else if (q.status === 'expired') {
      where.expiresAt = { lte: now };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.link.findMany({
        where,
        include: { tags: true },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.link.count({ where }),
    ]);
    return { items: rows.map(toEntity), total };
  }

  async update(id: number, userId: string, data: UpdateLinkData) {
    const { tags, ...scalars } = data;
    const row = await this.prisma.$transaction(async (tx) => {
      if (tags !== undefined) {
        await tx.link.update({ where: { id }, data: { tags: { set: [] } } });
      }
      return tx.link.update({
        where: { id },
        data: {
          ...scalars,
          ...(tags !== undefined && tags.length ? { tags: { connectOrCreate: connectTags(userId, tags) } } : {}),
        },
        include: { tags: true },
      });
    });
    return toEntity(row);
  }

  async deleteMany(ids: number[], userId: string) {
    const rows = await this.prisma.link.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true, shortCode: true },
    });
    await this.prisma.link.deleteMany({ where: { id: { in: rows.map((r) => r.id) }, userId } });
    return rows.map((r) => r.shortCode);
  }

  async consumeClick(id: number) {
    const updated = await this.prisma.$executeRaw`
      UPDATE "Link" SET "clickCount" = "clickCount" + 1
      WHERE "id" = ${id} AND ("maxClicks" IS NULL OR "clickCount" < "maxClicks")`;
    return updated > 0;
  }

  async incrementClicks(id: number) {
    await this.prisma.link.update({ where: { id }, data: { clickCount: { increment: 1 } } });
  }

  async listTags(userId: string) {
    const tags = await this.prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } });
    return tags.map((t) => t.name);
  }
}
