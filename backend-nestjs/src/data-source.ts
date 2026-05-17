import { DataSource } from 'typeorm';
import { Zone } from './modules/zones/zone.entity';
import { User } from './modules/auth/entities/user.entity';
import { Session } from './modules/auth/entities/session.entity';
import { Account } from './modules/auth/entities/account.entity';
import { Verification } from './modules/auth/entities/verification.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'greenalgeria',
  password: 'greenalgeria',
  database: 'greenalgeria',
  entities: [Zone, User, Session, Account, Verification],
  migrations: ['src/migrations/*.ts'],
});
