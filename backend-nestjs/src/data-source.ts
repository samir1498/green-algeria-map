import { DataSource } from 'typeorm';
import { ZoneOrmEntity } from './modules/zones/infrastructure/zone.orm-entity';
import { DamageReportOrmEntity } from './modules/damage-reports/infrastructure/damage-report.orm-entity';
import { User } from './modules/auth/infrastructure/entities/user.entity';
import { Session } from './modules/auth/infrastructure/entities/session.entity';
import { Account } from './modules/auth/infrastructure/entities/account.entity';
import { Verification } from './modules/auth/infrastructure/entities/verification.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'greenalgeria',
  password: process.env.DB_PASSWORD ?? 'greenalgeria',
  database: process.env.DB_NAME ?? 'greenalgeria',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  entities: [
    ZoneOrmEntity,
    DamageReportOrmEntity,
    User,
    Session,
    Account,
    Verification,
  ],
  migrations: ['src/migrations/*.ts'],
});
