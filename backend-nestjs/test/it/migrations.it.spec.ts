import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { User } from '../../src/modules/auth/entities/user.entity';
import { Session } from '../../src/modules/auth/entities/session.entity';
import { Account } from '../../src/modules/auth/entities/account.entity';
import { Verification } from '../../src/modules/auth/entities/verification.entity';

const allEntities = [ZoneOrmEntity, User, Session, Account, Verification];

async function createTestDatabase(
  container: StartedPostgreSqlContainer,
  dbName: string,
): Promise<DataSource> {
  const adminDs = new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  });
  await adminDs.initialize();
  await adminDs.query(`CREATE DATABASE "${dbName}"`);
  await adminDs.destroy();

  return new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: dbName,
    entities: allEntities,
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
  });
}

describe('Migrations (integration)', () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_greenalgeria')
      .withUsername('test_greenalgeria')
      .withPassword('test_greenalgeria')
      .withExposedPorts(5432)
      .start();
  });

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  it('runs all migrations without error', async () => {
    const dataSource = await createTestDatabase(
      container,
      'test_migrations_run',
    );
    await dataSource.initialize();

    const migrations = await dataSource.runMigrations();

    expect(migrations.length).toBeGreaterThanOrEqual(2);
    await dataSource.destroy();
  });

  it('creates all expected tables after migration', async () => {
    const dataSource = await createTestDatabase(
      container,
      'test_migrations_tables',
    );
    await dataSource.initialize();
    await dataSource.runMigrations();

    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.getTables();
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain('zones');
    expect(tableNames).toContain('user');
    expect(tableNames).toContain('session');
    expect(tableNames).toContain('account');
    expect(tableNames).toContain('verification');
    await queryRunner.release();
    await dataSource.destroy();
  });

  it('reverts last migration successfully', async () => {
    const dataSource = await createTestDatabase(
      container,
      'test_migrations_revert',
    );
    await dataSource.initialize();
    await dataSource.runMigrations();
    await dataSource.undoLastMigration();
    await dataSource.undoLastMigration();

    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.getTables();
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).not.toContain('zones');
    expect(tableNames).not.toContain('user');
    await queryRunner.release();
    await dataSource.destroy();
  });

  it('is idempotent when run on already-migrated database', async () => {
    const dataSource = await createTestDatabase(
      container,
      'test_migrations_idempotent',
    );
    await dataSource.initialize();
    await dataSource.runMigrations();

    await expect(dataSource.runMigrations()).resolves.not.toThrow();
    await dataSource.destroy();
  });
});
