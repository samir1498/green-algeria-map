import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
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

describe.skip('Auth (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_greenalgeria')
      .withUsername('test_greenalgeria')
      .withPassword('test_greenalgeria')
      .withExposedPorts(5432)
      .start();

    process.env.DATABASE_URL = `postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/${container.getDatabase()}`;
    process.env.BETTER_AUTH_URL = 'http://localhost:8080';
    process.env.CLIENT_URL = 'http://localhost:3000';

    // @ts-expect-error ESM-only package, skipped at runtime
    const { AppModule } = await import('../../src/app.module');

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getPort(),
          username: container.getUsername(),
          password: container.getPassword(),
          database: container.getDatabase(),
          entities: [ZoneOrmEntity, User, Session, Account, Verification],
          synchronize: true,
        }),
        AppModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (container) {
      await container.stop();
    }
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
      expect(res.body.session).toBeDefined();
    });

    it('rejects duplicate email', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'password123',
          role: 'volunteer',
        })
        .expect(200);

      await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'password456',
          role: 'volunteer',
        })
        .expect(400);
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

      expect(res.body.session).toBeDefined();
      expect(res.body.user.email).toBe('login@example.com');
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

    it('returns 401 without cookie', async () => {
      await supertest(app.getHttpServer())
        .get('/api/auth/get-session')
        .expect(401);
    });
  });

  describe('POST /api/auth/sign-out', () => {
    let cookie: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'SignOut User',
          email: 'signout@example.com',
          password: 'password123',
          role: 'volunteer',
        });

      cookie = res.headers['set-cookie']?.[0] ?? '';
    });

    it('signs out and invalidates session', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-out')
        .set('Cookie', cookie)
        .expect(200);

      await supertest(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', cookie)
        .expect(401);
    });
  });
});
