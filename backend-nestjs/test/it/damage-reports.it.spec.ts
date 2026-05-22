import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { createTestingModule } from '../setup/create-testing-module';

const nonExistentId = '00000000-0000-0000-0000-000000000000';

describe('Damage Reports HTTP (integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_greenalgeria')
      .withUsername('test_greenalgeria')
      .withPassword('test_greenalgeria')
      .withExposedPorts(5432)
      .start();

    const { app: createdApp } = await createTestingModule({
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    });
    app = createdApp;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (container) {
      await container.stop();
    }
  });

  describe('POST /damage-reports', () => {
    it('creates a damage report and returns it with a valid id', () => {
      return supertest(app.getHttpServer())
        .post('/damage-reports')
        .send({
          zoneId: 'zone-1',
          type: 'fire',
          severity: 'medium',
          status: 'reported',
          lat: 36.5,
          lng: 3.0,
          description: 'Fire spotted near forest',
          reportedBy: 'Volunteer-001',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.zoneId).toBe('zone-1');
          expect(res.body.type).toBe('fire');
          expect(res.body.severity).toBe('medium');
          expect(res.body.status).toBe('reported');
          expect(res.body.lat).toBe(36.5);
          expect(res.body.lng).toBe(3);
          expect(res.body.description).toBe('Fire spotted near forest');
          expect(res.body.reportedBy).toBe('Volunteer-001');
          expect(typeof res.body.id).toBe('string');
        });
    });

    it('rejects invalid payload with 400', () => {
      return supertest(app.getHttpServer())
        .post('/damage-reports')
        .send({ zoneId: 'zone-1' })
        .expect(400);
    });

    it('accepts negative longitude (Algerian coordinates)', () => {
      return supertest(app.getHttpServer())
        .post('/damage-reports')
        .send({
          zoneId: 'zone-2',
          type: 'trash',
          severity: 'low',
          status: 'reported',
          lat: 35.7,
          lng: -0.64,
          description: 'Trash near Oran',
          reportedBy: 'Volunteer-002',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.lng).toBe(-0.64);
        });
    });
  });

  describe('GET /damage-reports', () => {
    it('returns all damage reports as an array', () => {
      return supertest(app.getHttpServer())
        .get('/damage-reports')
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('GET /damage-reports/:id', () => {
    let reportId: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer())
        .post('/damage-reports')
        .send({
          zoneId: 'zone-lookup',
          type: 'pest',
          severity: 'high',
          status: 'reported',
          lat: 36.0,
          lng: 1.0,
          description: 'Pest infestation',
          reportedBy: 'Volunteer-003',
        });
      reportId = res.body.id;
    });

    it('returns a damage report by id', () => {
      return supertest(app.getHttpServer())
        .get(`/damage-reports/${reportId}`)
        .expect(200)
        .then((res) => {
          expect(res.body.id).toBe(reportId);
          expect(res.body.zoneId).toBe('zone-lookup');
        });
    });

    it('returns 404 for non-existent damage report', () => {
      return supertest(app.getHttpServer())
        .get(`/damage-reports/${nonExistentId}`)
        .expect(404);
    });

    it('returns 400 for malformed id', () => {
      return supertest(app.getHttpServer())
        .get('/damage-reports/not-a-uuid')
        .expect(400);
    });
  });

  describe('PATCH /damage-reports/:id/status', () => {
    let reportId: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer())
        .post('/damage-reports')
        .send({
          zoneId: 'zone-update',
          type: 'fire',
          severity: 'medium',
          status: 'reported',
          lat: 34.0,
          lng: 2.0,
          description: 'Before update',
          reportedBy: 'Volunteer-004',
        });
      reportId = res.body.id;
    });

    it('updates damage report status', () => {
      return supertest(app.getHttpServer())
        .patch(`/damage-reports/${reportId}/status`)
        .send({ status: 'in-progress' })
        .expect(200)
        .then((res) => {
          expect(res.body.status).toBe('in-progress');
          expect(res.body.id).toBe(reportId);
        });
    });

    it('returns 404 for non-existent damage report', () => {
      return supertest(app.getHttpServer())
        .patch(`/damage-reports/${nonExistentId}/status`)
        .send({ status: 'resolved' })
        .expect(404);
    });

    it('returns 400 for malformed id', () => {
      return supertest(app.getHttpServer())
        .patch('/damage-reports/not-a-uuid/status')
        .send({ status: 'resolved' })
        .expect(400);
    });
  });

  describe('DELETE /damage-reports/:id', () => {
    let reportId: string;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer())
        .post('/damage-reports')
        .send({
          zoneId: 'zone-delete',
          type: 'trash',
          severity: 'low',
          status: 'reported',
          lat: 33.0,
          lng: 4.0,
          description: 'To be deleted',
          reportedBy: 'Volunteer-005',
        });
      reportId = res.body.id;
    });

    it('deletes a damage report', () => {
      return supertest(app.getHttpServer())
        .delete(`/damage-reports/${reportId}`)
        .expect(200);
    });

    it('returns 404 after deletion', () => {
      return supertest(app.getHttpServer())
        .get(`/damage-reports/${reportId}`)
        .expect(404);
    });

    it('returns 404 for non-existent damage report', () => {
      return supertest(app.getHttpServer())
        .delete(`/damage-reports/${nonExistentId}`)
        .expect(404);
    });

    it('returns 400 for malformed id', () => {
      return supertest(app.getHttpServer())
        .delete('/damage-reports/not-a-uuid')
        .expect(400);
    });
  });
});
