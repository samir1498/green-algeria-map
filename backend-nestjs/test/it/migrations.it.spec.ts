import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { User } from '../../src/modules/auth/infrastructure/entities/user.entity';
import { Session } from '../../src/modules/auth/infrastructure/entities/session.entity';
import { Account } from '../../src/modules/auth/infrastructure/entities/account.entity';
import { Verification } from '../../src/modules/auth/infrastructure/entities/verification.entity';

const execAsync = promisify(exec);

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
  try {
    await adminDs.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await adminDs.destroy();
  }

  // Create schema in the new database
  const setupDs = new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: dbName,
  });
  await setupDs.initialize();
  try {
    await setupDs.query(`CREATE SCHEMA IF NOT EXISTS nestjs`);
  } finally {
    await setupDs.destroy();
  }

  return new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: dbName,
    entities: allEntities,
    synchronize: false,
  });
}

async function runMigrationsCli(
  container: StartedPostgreSqlContainer,
  dbName: string,
): Promise<void> {
  await execAsync(
    `DB_HOST=${container.getHost()} DB_PORT=${container.getPort()} DB_USERNAME=${container.getUsername()} DB_PASSWORD=${container.getPassword()} DB_NAME=${dbName} pnpm migration:run`,
    { cwd: process.cwd() },
  );
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
    try {
      await runMigrationsCli(container, 'test_migrations_run');
      const queryRunner = dataSource.createQueryRunner();
      const tables = await queryRunner.getTables();
      expect(tables.length).toBeGreaterThan(2);
      await queryRunner.release();
    } finally {
      await dataSource.destroy();
    }
  });

  it('creates all expected tables after migration', async () => {
    const dataSource = await createTestDatabase(
      container,
      'test_migrations_tables',
    );
    await dataSource.initialize();
    try {
      await runMigrationsCli(container, 'test_migrations_tables');
      const queryRunner = dataSource.createQueryRunner();
      try {
        const tables = await queryRunner.getTables();
        const tableNames = tables.map((t) => t.name);

        expect(tableNames).toContain('zones');
        expect(tableNames).toContain('user');
        expect(tableNames).toContain('session');
        expect(tableNames).toContain('account');
        expect(tableNames).toContain('verification');
      } finally {
        await queryRunner.release();
      }
    } finally {
      await dataSource.destroy();
    }
  });

  it('reverts all migrations successfully', async () => {
    const dataSource = await createTestDatabase(
      container,
      'test_migrations_revert',
    );
    await dataSource.initialize();
    try {
      await runMigrationsCli(container, 'test_migrations_revert');

      const revert = () =>
        execAsync(
          `DB_HOST=${container.getHost()} DB_PORT=${container.getPort()} DB_USERNAME=${container.getUsername()} DB_PASSWORD=${container.getPassword()} DB_NAME=test_migrations_revert pnpm migration:revert`,
          { cwd: process.cwd() },
        );

      for (let i = 0; i < 10; i++) {
        try {
          await revert();
        } catch {
          break;
        }
      }

      const queryRunner = dataSource.createQueryRunner();
      try {
        const tables = await queryRunner.getTables();
        const tableNames = tables.map((t) => t.name);

        expect(tableNames).not.toContain('zones');
        expect(tableNames).not.toContain('user');
        expect(tableNames).not.toContain('damage_reports');
      } finally {
        await queryRunner.release();
      }
    } finally {
      await dataSource.destroy();
    }
  });

  it('is idempotent when run on already-migrated database', async () => {
    const dataSource = await createTestDatabase(
      container,
      'test_migrations_idempotent',
    );
    await dataSource.initialize();
    try {
      await runMigrationsCli(container, 'test_migrations_idempotent');
      await runMigrationsCli(container, 'test_migrations_idempotent');
      const queryRunner = dataSource.createQueryRunner();
      const tables = await queryRunner.getTables();
      expect(tables.length).toBeGreaterThan(2);
      await queryRunner.release();
    } finally {
      await dataSource.destroy();
    }
  });
});
