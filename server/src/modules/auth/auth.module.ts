import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CreateApiKey, ListApiKeys, RevokeApiKey } from './application/api-key.use-cases';
import { IssueSession, LoginUser, LogoutUser, RefreshSession, RegisterUser } from './application/auth.use-cases';
import { ApiKeyRepository } from './domain/api-key.repository';
import { TokenService } from './domain/token.service';
import { UserRepository } from './domain/user.repository';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaApiKeyRepository } from './infrastructure/prisma-api-key.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { AuthGuard, OptionalAuthGuard } from './presentation/auth.guard';
import { ApiKeysController, AuthController } from './presentation/auth.controller';

/** Global so any module can use AuthGuard / OptionalAuthGuard without re-importing. */
@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, ApiKeysController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: ApiKeyRepository, useClass: PrismaApiKeyRepository },
    { provide: TokenService, useClass: JwtTokenService },
    IssueSession, RegisterUser, LoginUser, RefreshSession, LogoutUser,
    CreateApiKey, ListApiKeys, RevokeApiKey,
    AuthGuard, OptionalAuthGuard,
  ],
  exports: [TokenService, ApiKeyRepository, AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
