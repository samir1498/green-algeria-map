import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

export function getDbConfig(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'greenalgeria',
    password: process.env.DB_PASSWORD ?? 'greenalgeria',
    database: process.env.DB_NAME ?? 'greenalgeria',
    schema: 'nestjs',
    extra: { options: '-c search_path=nestjs,public,extensions' },
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  };
}

export function getDbModuleConfig(): TypeOrmModuleOptions {
  return {
    ...getDbConfig(),
    autoLoadEntities: true,
    synchronize: false,
  };
}
