import { DataSource } from 'typeorm';
import { Zone } from './modules/zones/zone.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'greenalgeria',
  password: 'greenalgeria',
  database: 'greenalgeria',
  entities: [Zone],
  migrations: ['src/migrations/*.ts'],
});
