import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, UseGuards } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import supertest from 'supertest';

@Controller('test')
class TestController {
  @Get('ping')
  ping() {
    return { status: 'ok' };
  }

  @Get('auth-test')
  authTest() {
    return { auth: true };
  }
}

describe('Rate Limiting', () => {
  beforeAll(() => {
    process.env.DISABLE_RATE_LIMIT = 'false';
  });
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'test',
            ttl: 60_000,
            limit: 5,
            skipIf: (context) =>
              context
                .switchToHttp()
                .getRequest<{ url?: string }>()
                .url?.startsWith('/test/auth-test') ?? false,
          },
        ]),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should block requests beyond the limit (5 req/min)', async () => {
    for (let i = 0; i < 5; i++) {
      await supertest(app.getHttpServer()).get('/test/ping').expect(200);
    }
    await supertest(app.getHttpServer()).get('/test/ping').expect(429);
  });

  it('should skip throttling for skipped paths', async () => {
    for (let i = 0; i < 20; i++) {
      await supertest(app.getHttpServer()).get('/test/auth-test').expect(200);
    }
  });
});
