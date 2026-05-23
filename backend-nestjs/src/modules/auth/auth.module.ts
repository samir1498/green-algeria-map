import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './infrastructure/better-auth.config';
import { PoolService } from './infrastructure/pool.service';
import { AuthService } from './infrastructure/auth.service';
import { User } from './infrastructure/entities/user.entity';
import { Session } from './infrastructure/entities/session.entity';
import { Account } from './infrastructure/entities/account.entity';
import { Verification } from './infrastructure/entities/verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, Account, Verification]),
    BetterAuthModule.forRoot({ auth }),
  ],
  providers: [PoolService, AuthService],
  exports: [PoolService, AuthService],
})
export class AuthModule {}
