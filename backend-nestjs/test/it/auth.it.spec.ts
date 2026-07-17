import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrevoClient } from '../../src/modules/email/brevo.client';

// Capture transactional emails instead of calling Brevo (no API key in the test
// environment). The verification / reset links are extracted from the captured
// HTML so the full flows can be exercised end-to-end.
const sentEmails: string[] = [];
BrevoClient.prototype.send = async (opts: { html: string }) => {
  sentEmails.push(opts.html);
  return;
};

import { User } from '../../src/modules/auth/infrastructure/entities/user.entity';
import { Session } from '../../src/modules/auth/infrastructure/entities/session.entity';
import { Account } from '../../src/modules/auth/infrastructure/entities/account.entity';
import { Verification } from '../../src/modules/auth/infrastructure/entities/verification.entity';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { DamageReportOrmEntity } from '../../src/modules/damage-reports/infrastructure/damage-report.orm-entity';

function extractToken(html: string, kind: 'verify' | 'reset'): string | null {
  // Verification links carry a stateless JWT as a query param:
  //   /api/auth/verify-email?token=<jwt>
  // Reset links carry an opaque, DB-backed token as a path param:
  //   /api/auth/reset-password/<token>?callbackURL=
  const re =
    kind === 'verify'
      ? /\/api\/auth\/verify-email\?token=([^"&\s<]+)/
      : /\/api\/auth\/reset-password\/([^"?\s<]+)/;
  const m = html.match(re);
  return m ? m[1] : null;
}

function getCookie(res: supertest.Response): string {
  return res.headers['set-cookie']?.[0]?.split(';')[0] ?? '';
}

describe('Auth (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;
  let dataSource: DataSource;

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
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
    process.env.OO_OBJECT_STORAGE_ENDPOINT = 'http://localhost:9000';
    process.env.OO_OBJECT_STORAGE_REGION = 'us-east-1';
    process.env.OO_OBJECT_STORAGE_BUCKET = 'test-bucket';
    process.env.OO_OBJECT_STORAGE_ACCESS_KEY = 'test-access';
    process.env.OO_OBJECT_STORAGE_SECRET_KEY = 'test-secret';

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
    dataSource = app.get(DataSource);
  }, 120000);

  afterAll(async () => {
    if (app) {
      const ds = app.get(DataSource);
      await ds.destroy();
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

  const signUp = (name: string, email: string, password = 'password123') =>
    supertest(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({ name, email, password });

  const verifyByEmail = async (email: string) => {
    const html =
      sentEmails.find((h) => h.includes(email)) ??
      sentEmails[sentEmails.length - 1];
    const token = extractToken(html, 'verify');
    expect(token).toBeTruthy();
    const res = await supertest(app.getHttpServer())
      .get('/api/auth/verify-email')
      .query({ token });
    expect(res.status).toBe(200);
  };

  const forgotPassword = (email: string) =>
    supertest(app.getHttpServer())
      .post('/api/auth/request-password-reset')
      .send({ email });

  describe('POST /api/auth/sign-up/email', () => {
    it('creates a user and returns session', async () => {
      const res = await signUp('Test User', 'test@example.com').expect(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.name).toBe('Test User');
    });

    it('rejects duplicate email', async () => {
      await signUp('First', 'dup@example.com').expect(200);
      const res = await signUp('Second', 'dup@example.com', 'pass456');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/sign-in/email', () => {
    const email = 'login@example.com';
    beforeAll(async () => {
      sentEmails.length = 0;
      await signUp('Login User', email, 'correctpassword');
      await verifyByEmail(email);
    });

    it('returns user with valid credentials', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email, password: 'correctpassword' })
        .expect(200);
      expect(res.body.user?.email).toBe(email);
    });

    it('rejects invalid password', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email, password: 'wrong' })
        .expect(401);
    });

    it('rejects non-existent email', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email: 'nobody@example.com', password: 'pass' })
        .expect(401);
    });
  });

  describe('email verification', () => {
    it('blocks sign-in until the email is verified', async () => {
      const email = 'unverified@example.com';
      await signUp('Unverified', email);
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email, password: 'password123' })
        .expect(403);
    });

    it('verifies the email via the link and unblocks sign-in', async () => {
      const email = 'verify-flow@example.com';
      sentEmails.length = 0;
      await signUp('Verify Flow', email);

      const html = sentEmails[sentEmails.length - 1];
      const token = extractToken(html, 'verify');
      expect(token).toBeTruthy();

      const res = await supertest(app.getHttpServer())
        .get('/api/auth/verify-email')
        .query({ token });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);

      const users = await dataSource.query(
        'SELECT "emailVerified" FROM "user" WHERE email = $1',
        [email],
      );
      expect(users[0].emailVerified).toBe(true);

      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email, password: 'password123' })
        .expect(200);
    });

    it('rejects an invalid verification token', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/auth/verify-email')
        .query({ token: 'not-a-real-token' });
      expect(res.status).toBe(401);
    });
  });

  describe('password reset', () => {
    const email = 'reset-flow@example.com';
    beforeAll(async () => {
      sentEmails.length = 0;
      await signUp('Reset Flow', email);
      await verifyByEmail(email);
    });

    it('resets the password end-to-end', async () => {
      sentEmails.length = 0;
      await forgotPassword(email).expect(200);

      const html = sentEmails[sentEmails.length - 1];
      const token = extractToken(html, 'reset');
      expect(token).toBeTruthy();

      await supertest(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ newPassword: 'brandNewPass456', token })
        .expect(200);

      // New password works.
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email, password: 'brandNewPass456' })
        .expect(200);

      // Old password no longer works.
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email, password: 'password123' })
        .expect(401);
    });

    it('rejects an invalid reset token', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ newPassword: 'whatever123', token: 'bad-token' });
      expect(res.status).toBe(400);
    });

    it('does not leak whether an email exists', async () => {
      await forgotPassword('does-not-exist@example.com').expect(200);
    });
  });

  describe('GET /api/auth/get-session', () => {
    it('returns session with valid cookie', async () => {
      const signUpRes = await signUp('Session', 'session@example.com').expect(
        200,
      );
      const cookie = getCookie(signUpRes);
      await supertest(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', cookie)
        .expect(200);
    });

    it('returns null without cookie', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/auth/get-session')
        .expect(200);
      expect(res.body).toBeNull();
    });
  });

  describe('POST /api/auth/sign-out', () => {
    it('signs out and invalidates session', async () => {
      const signUpRes = await signUp('SignOut', 'signout@example.com').expect(
        200,
      );
      const cookie = getCookie(signUpRes);
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

  describe('OAuth (social sign-in)', () => {
    const expectProviderRedirect = (res: supertest.Response, host: string) => {
      if (res.status === 302) {
        expect(res.headers.location).toContain(host);
      } else {
        expect(res.status).toBe(200);
        expect(res.body.url ?? res.body.redirect).toContain(host);
      }
    };

    it('redirects to Google authorize URL', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/social')
        .send({ provider: 'google', callbackURL: 'http://localhost:3000' });
      expectProviderRedirect(res, 'accounts.google.com');
    });

    it('redirects to GitHub authorize URL', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/social')
        .send({ provider: 'github', callbackURL: 'http://localhost:3000' });
      expectProviderRedirect(res, 'github.com');
    });

    it('rejects an unsupported provider', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/sign-in/social')
        .send({ provider: 'twitter', callbackURL: 'http://localhost:3000' })
        .expect(404);
    });
  });
});
