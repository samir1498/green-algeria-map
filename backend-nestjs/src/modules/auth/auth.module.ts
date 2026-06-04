import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './infrastructure/better-auth.config';
import { User } from './domain/entities/user.entity';
import { Session } from './domain/entities/session.entity';
import { Account } from './domain/entities/account.entity';
import { Verification } from './domain/entities/verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, Account, Verification]),
    BetterAuthModule.forRoot({ auth }),
  ],
})
export class AuthModule {}
