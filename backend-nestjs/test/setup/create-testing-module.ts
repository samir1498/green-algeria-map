import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { TestZonesModule } from './test-zones.module';

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
      TypeOrmModule.forRoot({
        type: 'postgres',
        host,
        port,
        username,
        password,
        database,
        entities: [ZoneOrmEntity],
        synchronize: false,
        migrations: ['src/migrations/*.ts'],
      }),
      TestZonesModule,
    ],
  }).compile();

  const dataSource = module.get(DataSource);
  await dataSource.runMigrations();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  return { module, app };
}
