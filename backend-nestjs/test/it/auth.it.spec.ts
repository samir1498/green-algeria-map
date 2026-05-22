import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../../src/modules/auth/infrastructure/entities/user.entity';
import { Session } from '../../src/modules/auth/infrastructure/entities/session.entity';
import { Account } from '../../src/modules/auth/infrastructure/entities/account.entity';
import { Verification } from '../../src/modules/auth/infrastructure/entities/verification.entity';
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

    // @ts-ignore - dynamic ESM import, works at runtime but not resolvable by tsc
    const { AppModule } = await import('../../src/app.module');

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          inject: [],
          useFactory: () => ({
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
            synchronize: true,
          }),
        }),
        AppModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  }, 120000);

  afterAll(async () => {
    if (app) {
      const dataSource = app.get(DataSource);
      await dataSource.destroy();
      await app.close();
    }
    if (container) await container.stop();
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
        })
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.name).toBe('Test User');
    });

    it('rejects duplicate email', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'First',
          email: 'dup@example.com',
          password: 'password123',
        })
        .expect(200);

      const res = await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Second',
          email: 'dup@example.com',
          password: 'pass456',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
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
        });
    });

    it('returns user with valid credentials', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email: 'login@example.com', password: 'correctpassword' })
        .expect(200);

      expect(res.body.user?.email).toBe('login@example.com');
    });

    it('rejects invalid password', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email: 'login@example.com', password: 'wrong' })
        .expect(401);
    });

    it('rejects non-existent email', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email: 'nobody@example.com', password: 'pass' })
        .expect(401);
    });
  });

  describe('GET /api/auth/get-session', () => {
    it('returns session with valid cookie', async () => {
      const signUp = await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Session',
          email: 'session@example.com',
          password: 'password123',
        })
        .expect(200);

      const cookie = signUp.headers['set-cookie']?.[0]?.split(';')[0] ?? '';

      await supertest(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', cookie)
        .expect(200);
    });

    it('returns session info without cookie', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/auth/get-session')
        .expect(200);

      expect(res.body).toBeNull();
    });
  });

  describe('POST /api/auth/sign-out', () => {
    it('signs out and invalidates session', async () => {
      const signUp = await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'SignOut',
          email: 'signout@example.com',
          password: 'password123',
        })
        .expect(200);

      const cookie = signUp.headers['set-cookie']?.[0]?.split(';')[0] ?? '';

      await supertest(app.getHttpServer())
        .post('/api/auth/sign-out')
        .set('Cookie', cookie)
        .expect(200);

      const sessionRes = await supertest(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', cookie);

      expect(sessionRes.body).toBeNull();
    });
  });
});
