import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { createTestingModule } from '../setup/create-testing-module';
import { ZoneRepository } from '../../src/modules/zones/infrastructure/zone.repository';

describe('Zone caching (integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let repo: ZoneRepository;

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
    repo = module.get(ZoneRepository);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GetAllZones', () => {
    it('returns cached result on repeated reads', async () => {
      const spy = vi.spyOn(repo, 'findAll');

      await supertest(app.getHttpServer()).get('/zones').expect(200);
      expect(spy).toHaveBeenCalledTimes(1);

      await supertest(app.getHttpServer()).get('/zones').expect(200);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('evicts cache after create and returns fresh data', async () => {
      const spy = vi.spyOn(repo, 'findAll');

      await supertest(app.getHttpServer())
        .post('/zones')
        .send({
          name: 'Eviction Test',
          type: 'planting',
          status: 'planned',
          lat: 36.0,
          lng: 3.0,
          description: 'Test',
        })
        .expect(201);

      await supertest(app.getHttpServer()).get('/zones').expect(200);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('GetZoneById', () => {
    let zoneId: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer())
        .post('/zones')
        .send({
          name: 'Cache By ID',
          type: 'trash',
          status: 'planned',
          lat: 35.0,
          lng: 1.0,
          description: 'test',
        })
        .expect(201);
      zoneId = res.body.id;
    });

    it('returns cached zone on second read', async () => {
      const spy = vi.spyOn(repo, 'findById');

      await supertest(app.getHttpServer()).get(`/zones/${zoneId}`).expect(200);
      expect(spy).toHaveBeenCalledTimes(1);

      await supertest(app.getHttpServer()).get(`/zones/${zoneId}`).expect(200);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('evicts individual zone cache on update', async () => {
      const spy = vi.spyOn(repo, 'findById');

      await supertest(app.getHttpServer())
        .patch(`/zones/${zoneId}`)
        .send({ name: 'Updated Cache' })
        .expect(200);

      await supertest(app.getHttpServer()).get(`/zones/${zoneId}`).expect(200);
      expect(spy).toHaveBeenCalled();
    });
  });
});
