import { DataSource } from 'typeorm';
import { getDbConfig } from './db-config';
import { ZoneOrmEntity } from './modules/zones/infrastructure/zone.orm-entity';
import { DamageReportOrmEntity } from './modules/damage-reports/infrastructure/damage-report.orm-entity';
import { User } from './modules/auth/infrastructure/entities/user.entity';
import { Session } from './modules/auth/infrastructure/entities/session.entity';
import { Account } from './modules/auth/infrastructure/entities/account.entity';
import { Verification } from './modules/auth/infrastructure/entities/verification.entity';

export const AppDataSource = new DataSource({
  ...getDbConfig(),
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
