import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { DamageReportOrmEntity } from '../../src/modules/damage-reports/infrastructure/damage-report.orm-entity';
import { ZonesModule } from '../../src/modules/zones/zones.module';
import { DamageReportsModule } from '../../src/modules/damage-reports/damage-reports.module';

interface CreateTestingModuleOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export async function createTestingModule({
  host,
  port,
  username,
  password,
  database,
}: CreateTestingModuleOptions): Promise<{
  module: TestingModule;
  app: INestApplication;
}> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      CacheModule.register({ isGlobal: true, ttl: 300_000, max: 500 }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        host,
        port,
        username,
        password,
        database,
        entities: [ZoneOrmEntity, DamageReportOrmEntity],
        synchronize: true,
      }),
      ZonesModule,
      DamageReportsModule,
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  return { module, app };
}
