import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import supertest from 'supertest';
import { User } from '../../src/modules/auth/entities/user.entity';
import { Session } from '../../src/modules/auth/entities/session.entity';
import { Account } from '../../src/modules/auth/entities/account.entity';
import { Verification } from '../../src/modules/auth/entities/verification.entity';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { DamageReportOrmEntity } from '../../src/modules/damage-reports/infrastructure/damage-report.orm-entity';

describe('Auth (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_greenalgeria')
      .withUsername('test_greenalgeria')
      .withPassword('test_greenalgeria')
      .withExposedPorts(5432)
      .start();

    process.env.DB_HOST = container.getHost();
    process.env.DB_PORT = String(container.getPort());
    process.env.DB_USERNAME = container.getUsername();
    process.env.DB_PASSWORD = container.getPassword();
    process.env.DB_NAME = container.getDatabase();
    process.env.DATABASE_URL = `postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/${container.getDatabase()}`;
    process.env.BETTER_AUTH_URL = 'http://localhost:8080';
    process.env.CLIENT_URL = 'http://localhost:3000';

    // @ts-ignore - ESM dynamic import for NestJS testing
    const { AppModule } = await import('../../src/app.module');

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();

    const adminDs = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
      entities: [
        ZoneOrmEntity,
        DamageReportOrmEntity,
        User,
        Session,
        Account,
        Verification,
      ],
    });
    await adminDs.initialize();
    try {
      const runner = adminDs.createQueryRunner();
      await runner.connect();

      const migrationFiles = [
        '1778943830079-CreateZone.ts',
        '1779007912420-CreateAuthTables.ts',
        '1779203377543-CreateDamageReport.ts',
      ];
      for (const file of migrationFiles) {
        if (file === '1778943830079-CreateZone.ts') {
          await runner.query(`CREATE TABLE IF NOT EXISTS "zones" (
            "id" text NOT NULL,
            "name" text NOT NULL,
            "type" text NOT NULL,
            "status" text NOT NULL,
            "lat" double precision NOT NULL,
            "lng" double precision NOT NULL,
            "targetCount" integer,
            "currentCount" integer DEFAULT 0,
            "description" text NOT NULL DEFAULT '',
            CONSTRAINT "PK_zones" PRIMARY KEY ("id")
          )`);
        } else if (file === '1779007912420-CreateAuthTables.ts') {
          await runner.query(`CREATE TABLE IF NOT EXISTS "user" (
            "id" text NOT NULL,
            "name" text NOT NULL,
            "email" text NOT NULL,
            "emailVerified" boolean NOT NULL DEFAULT false,
            "image" text,
            "createdAt" timestamp NOT NULL,
            "updatedAt" timestamp NOT NULL,
            "role" text NOT NULL DEFAULT 'volunteer',
            CONSTRAINT "PK_user" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_user_email" UNIQUE ("email")
          )`);
          await runner.query(`CREATE TABLE IF NOT EXISTS "session" (
            "id" text NOT NULL,
            "expiresAt" timestamp NOT NULL,
            "token" text NOT NULL,
            "createdAt" timestamp NOT NULL,
            "updatedAt" timestamp NOT NULL,
            "ipAddress" text,
            "userAgent" text,
            "userId" text NOT NULL,
            CONSTRAINT "PK_session" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_session_token" UNIQUE ("token"),
            CONSTRAINT "FK_session_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
          )`);
          await runner.query(`CREATE TABLE IF NOT EXISTS "account" (
            "id" text NOT NULL,
            "accountId" text NOT NULL,
            "providerId" text NOT NULL,
            "userId" text NOT NULL,
            "accessToken" text,
            "refreshToken" text,
            "idToken" text,
            "accessTokenExpiresAt" timestamp,
            "refreshTokenExpiresAt" timestamp,
            "scope" text,
            "password" text,
            "createdAt" timestamp NOT NULL,
            "updatedAt" timestamp NOT NULL,
            CONSTRAINT "PK_account" PRIMARY KEY ("id"),
            CONSTRAINT "FK_account_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
          )`);
          await runner.query(`CREATE TABLE IF NOT EXISTS "verification" (
            "id" text NOT NULL,
            "identifier" text NOT NULL,
            "value" text NOT NULL,
            "expiresAt" timestamp NOT NULL,
            "createdAt" timestamp NOT NULL,
            "updatedAt" timestamp NOT NULL,
            CONSTRAINT "PK_verification" PRIMARY KEY ("id")
          )`);
          await runner.query(
            `CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId")`,
          );
          await runner.query(
            `CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId")`,
          );
          await runner.query(
            `CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier")`,
          );
        } else if (file === '1779203377543-CreateDamageReport.ts') {
          await runner.query(`CREATE TABLE IF NOT EXISTS "damage_reports" (
            "id" text NOT NULL,
            "lat" double precision NOT NULL,
            "lng" double precision NOT NULL,
            "type" text NOT NULL,
            "description" text NOT NULL,
            "imageUrl" text,
            "status" text NOT NULL DEFAULT 'pending',
            "reporterEmail" text,
            "createdAt" timestamp NOT NULL,
            "updatedAt" timestamp NOT NULL,
            CONSTRAINT "PK_damage_reports" PRIMARY KEY ("id")
          )`);
          await runner.query(
            `CREATE INDEX IF NOT EXISTS "idx_damage_reports_status" ON "damage_reports" ("status")`,
          );
        }
      }

      await runner.release();
    } finally {
      await adminDs.destroy();
    }

    await app.init();
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (container) {
      await container.stop();
    }
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.CLIENT_URL;
  });

  describe('POST /api/auth/sign-up/email', () => {
    it('creates a user and returns session', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'volunteer',
        })
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.role).toBe('volunteer');
    });

    it('rejects duplicate email', async () => {
      const first = await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'password123',
          role: 'volunteer',
        });

      expect(first.status).toBeLessThan(300);

      const second = await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'password456',
          role: 'volunteer',
        });

      expect(second.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/sign-in/email', () => {
    beforeAll(async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Login User',
          email: 'login@example.com',
          password: 'correctpassword',
          role: 'volunteer',
        });
    });

    it('returns session with valid credentials', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: 'login@example.com',
          password: 'correctpassword',
        })
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.user?.email).toBe('login@example.com');
    });

    it('rejects invalid password', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('rejects non-existent email', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: 'nobody@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/get-session', () => {
    let cookie: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Session User',
          email: 'session@example.com',
          password: 'password123',
          role: 'volunteer',
        });

      cookie = res.headers['set-cookie']?.[0] ?? '';
    });

    it('returns session with valid cookie', async () => {
      await supertest(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', cookie)
        .expect(200);
    });

    it('returns session info for unauthenticated request', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/auth/get-session')
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('POST /api/auth/sign-out', () => {
    it('signs out', async () => {
      const signUpRes = await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'SignOut User',
          email: 'signout@example.com',
          password: 'password123',
          role: 'volunteer',
        });

      const setCookieHeader = signUpRes.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();

      const cookie = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader;

      const signOutRes = await supertest(app.getHttpServer())
        .post('/api/auth/sign-out')
        .set('Cookie', cookie ?? '')
        .expect(200);

      expect(signOutRes.body).toBeDefined();
    });
  });
});
