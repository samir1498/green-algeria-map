import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDbModuleConfig } from './db-config';
import { ZonesModule } from './modules/zones/zones.module';
import { DamageReportsModule } from './modules/damage-reports/damage-reports.module';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthModule } from './health/health.module';
import { PublicModule } from './modules/public/public.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300_000,
      max: 500,
    }),
    ...(process.env.DISABLE_RATE_LIMIT === 'true'
      ? []
      : [
          ThrottlerModule.forRoot([
            {
              name: 'read',
              ttl: 60000,
              limit: 100,
              skipIf: (context) => {
                const req = context
                  .switchToHttp()
                  .getRequest<{ url?: string; method: string }>();
                return (
                  req.method !== 'GET' ||
                  (req.url?.startsWith('/api/auth') ?? false)
                );
              },
            },
            {
              name: 'write',
              ttl: 60000,
              limit: 30,
              skipIf: (context) => {
                const req = context
                  .switchToHttp()
                  .getRequest<{ url?: string; method: string }>();
                return (
                  req.method === 'GET' ||
                  (req.url?.startsWith('/api/auth') ?? false)
                );
              },
            },
          ]),
        ]),
    TypeOrmModule.forRoot(getDbModuleConfig()),
    AuthModule,
    ZonesModule,
    DamageReportsModule,
    StorageModule,
    HealthModule,
    PublicModule,
    EmailModule,
  ],
  providers: [
    ...(process.env.DISABLE_RATE_LIMIT === 'true'
      ? []
      : [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]),
  ],
})
export class AppModule {}
