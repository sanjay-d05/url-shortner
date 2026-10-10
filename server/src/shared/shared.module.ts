import { Global, Module } from '@nestjs/common';
import { PasswordHasher } from './domain/password-hasher';
import { BcryptHasher } from './infrastructure/bcrypt-hasher';
import { PrismaService } from './infrastructure/prisma.service';
import { RedisService } from './infrastructure/redis.service';

@Global()
@Module({
  providers: [PrismaService, RedisService, { provide: PasswordHasher, useClass: BcryptHasher }],
  exports: [PrismaService, RedisService, PasswordHasher],
})
export class SharedModule {}
