import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { TestZonesModule } from '../setup/test-zones.module';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';

const nonExistentId = '00000000-0000-0000-0000-000000000000';

describe('Zones (integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_greenalgeria')
      .withUsername('test_greenalgeria')
      .withPassword('test_greenalgeria')
      .withExposedPorts(5432)
      .start();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getPort(),
          username: container.getUsername(),
          password: container.getPassword(),
          database: container.getDatabase(),
          entities: [ZoneOrmEntity],
          synchronize: true,
        }),
        CqrsModule,
        TestZonesModule,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (container) {
      await container.stop();
    }
  });

  describe('POST /zones', () => {
    it('creates a zone and returns it with a valid id', () => {
      return supertest(app.getHttpServer())
        .post('/zones')
        .send({
          name: 'Test Zone',
          type: 'planting',
          status: 'planned',
          lat: 36.0,
          lng: 3.0,
          description: 'Test',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toBe('Test Zone');
          expect(res.body.type).toBe('planting');
          expect(res.body.status).toBe('planned');
          expect(res.body.lat).toBe(36);
          expect(res.body.lng).toBe(3);
          expect(res.body.description).toBe('Test');
          expect(typeof res.body.id).toBe('string');
        });
    });

    it('rejects invalid payload with 400', () => {
      return supertest(app.getHttpServer())
        .post('/zones')
        .send({ name: 'Missing fields' })
        .expect(400);
    });
  });

  describe('GET /zones', () => {
    it('returns all zones as an array', () => {
      return supertest(app.getHttpServer())
        .get('/zones')
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('GET /zones/:id', () => {
    let zoneId: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post('/zones').send({
        name: 'Lookup Test',
        type: 'trash',
        status: 'planned',
        lat: 35.0,
        lng: 1.0,
        description: 'For lookup',
      });
      zoneId = res.body.id;
    });

    it('returns a zone by id', () => {
      return supertest(app.getHttpServer())
        .get(`/zones/${zoneId}`)
        .expect(200)
        .then((res) => {
          expect(res.body.id).toBe(zoneId);
          expect(res.body.name).toBe('Lookup Test');
        });
    });

    it('returns 404 for non-existent zone', () => {
      return supertest(app.getHttpServer())
        .get(`/zones/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('PATCH /zones/:id', () => {
    let zoneId: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post('/zones').send({
        name: 'Update Test',
        type: 'cleanup',
        status: 'planned',
        lat: 34.0,
        lng: 2.0,
        description: 'Before update',
      });
      zoneId = res.body.id;
    });

    it('updates zone fields explicitly', () => {
      return supertest(app.getHttpServer())
        .patch(`/zones/${zoneId}`)
        .send({ name: 'Updated Name', status: 'in-progress' })
        .expect(200)
        .then((res) => {
          expect(res.body.name).toBe('Updated Name');
          expect(res.body.status).toBe('in-progress');
          expect(res.body.type).toBe('cleanup');
        });
    });

    it('returns 404 for non-existent zone', () => {
      return supertest(app.getHttpServer())
        .patch(`/zones/${nonExistentId}`)
        .send({ name: 'Nope' })
        .expect(404);
    });
  });

  describe('DELETE /zones/:id', () => {
    let zoneId: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post('/zones').send({
        name: 'Delete Me',
        type: 'planting',
        status: 'planned',
        lat: 33.0,
        lng: 4.0,
        description: 'To be deleted',
      });
      zoneId = res.body.id;
    });

    it('deletes a zone', () => {
      return supertest(app.getHttpServer())
        .delete(`/zones/${zoneId}`)
        .expect(200);
    });

    it('returns 404 after deletion', () => {
      return supertest(app.getHttpServer()).get(`/zones/${zoneId}`).expect(404);
    });

    it('returns 404 for non-existent zone', () => {
      return supertest(app.getHttpServer())
        .delete(`/zones/${nonExistentId}`)
        .expect(404);
    });
  });
});
