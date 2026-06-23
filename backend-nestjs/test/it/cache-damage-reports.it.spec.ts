import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  it,
  expect,
  vi,
} from 'vitest';
import { createTestingModule } from '../setup/create-testing-module';
import { DamageReportRepository } from '../../src/modules/damage-reports/infrastructure/damage-report.repository';

describe('Damage report caching (integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let repo: DamageReportRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_greenalgeria')
      .withUsername('test_greenalgeria')
      .withPassword('test_greenalgeria')
      .start();

    const { module, app: createdApp } = await createTestingModule({
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    });
    app = createdApp;
    repo = module.get(DamageReportRepository);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GetAllDamageReports', () => {
    it('returns cached result on repeated reads', async () => {
      const spy = vi.spyOn(repo, 'findAll');

      await supertest(app.getHttpServer()).get('/damage-reports').expect(200);
      expect(spy).toHaveBeenCalledTimes(1);

      await supertest(app.getHttpServer()).get('/damage-reports').expect(200);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('evicts cache after create', async () => {
      const spy = vi.spyOn(repo, 'findAll');

      await supertest(app.getHttpServer())
        .post('/damage-reports')
        .send({
          zoneId: 'zone-1',
          type: 'fire',
          severity: 'high',
          lat: 36.0,
          lng: 3.0,
          description: 'Test',
          reportedBy: 'tester',
        })
        .expect(201);

      await supertest(app.getHttpServer()).get('/damage-reports').expect(200);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('GetDamageReportById', () => {
    let reportId: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer())
        .post('/damage-reports')
        .send({
          zoneId: 'zone-1',
          type: 'fire',
          severity: 'high',
          lat: 35.0,
          lng: 1.0,
          description: 'Cache test',
          reportedBy: 'tester',
        })
        .expect(201);
      reportId = res.body.id;
    });

    it('returns cached report on second read', async () => {
      const spy = vi.spyOn(repo, 'findById');

      await supertest(app.getHttpServer())
        .get(`/damage-reports/${reportId}`)
        .expect(200);
      expect(spy).toHaveBeenCalledTimes(1);

      await supertest(app.getHttpServer())
        .get(`/damage-reports/${reportId}`)
        .expect(200);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
