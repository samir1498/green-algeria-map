import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import supertest from 'supertest';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { GenericContainer, Wait } from 'testcontainers';
import axios from 'axios';
import { signS3CreateBucket, signS3Get } from '../setup/s3-signing';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { ZonesModule } from '../../src/modules/zones/zones.module';
import { StorageModule } from '../../src/modules/storage/storage.module';

const RUSTFS_ACCESS_KEY = 'test-access-key';
const RUSTFS_SECRET_KEY = 'test-secret-key';
const RUSTFS_BUCKET = 'test-bucket';
const RUSTFS_REGION = 'us-east-1';

async function createBucket(
  endpoint: string,
  bucket: string,
  accessKey: string,
  secretKey: string,
  region: string,
  retries = 10,
): Promise<void> {
  const baseUrl = endpoint.replace(/\/+$/, '');
  for (let i = 0; i < retries; i++) {
    try {
      const headers = signS3CreateBucket(
        endpoint,
        bucket,
        accessKey,
        secretKey,
        region,
      );
      await axios.put(`${baseUrl}/${bucket}`, Buffer.alloc(0), { headers });
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

describe('Storage upload (integration)', () => {
  let app: INestApplication;
  let postgresContainer: StartedPostgreSqlContainer;
  let rustfsContainer: StartedTestContainer;
  let rustfsEndpoint: string;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_greenalgeria')
      .withUsername('test_greenalgeria')
      .withPassword('test_greenalgeria')
      .withExposedPorts(5432)
      .start();

    rustfsContainer = await new GenericContainer('rustfs/rustfs:latest')
      .withExposedPorts(9000)
      .withEnvironment({
        RUSTFS_VOLUMES: '/data',
        RUSTFS_ADDRESS: '0.0.0.0:9000',
        RUSTFS_ACCESS_KEY: RUSTFS_ACCESS_KEY,
        RUSTFS_SECRET_KEY: RUSTFS_SECRET_KEY,
      })
      .withWaitStrategy(Wait.forListeningPorts())
      .start();

    rustfsEndpoint = `http://${rustfsContainer.getHost()}:${rustfsContainer.getMappedPort(9000)}`;

    await createBucket(
      rustfsEndpoint,
      RUSTFS_BUCKET,
      RUSTFS_ACCESS_KEY,
      RUSTFS_SECRET_KEY,
      RUSTFS_REGION,
    );

    process.env.OO_OBJECT_STORAGE_ENDPOINT = rustfsEndpoint;
    process.env.OO_OBJECT_STORAGE_REGION = RUSTFS_REGION;
    process.env.OO_OBJECT_STORAGE_BUCKET = RUSTFS_BUCKET;
    process.env.OO_OBJECT_STORAGE_ACCESS_KEY = RUSTFS_ACCESS_KEY;
    process.env.OO_OBJECT_STORAGE_SECRET_KEY = RUSTFS_SECRET_KEY;

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
        }),
        CqrsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: postgresContainer.getHost(),
          port: postgresContainer.getPort(),
          username: postgresContainer.getUsername(),
          password: postgresContainer.getPassword(),
          database: postgresContainer.getDatabase(),
          entities: [ZoneOrmEntity],
          synchronize: true,
        }),
        ZonesModule,
        StorageModule,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (postgresContainer) await postgresContainer.stop();
    if (rustfsContainer) await rustfsContainer.stop();
  });

  describe('POST /storage/zones/:id/photo', () => {
    it('uploads a photo, stores it in RustFS, and links it to the zone', async () => {
      const uploadedContent = Buffer.from('test-image-content');

      const createRes = await supertest(app.getHttpServer())
        .post('/zones')
        .send({
          name: 'Photo Upload Zone',
          type: 'planting',
          status: 'planned',
          lat: 36.5,
          lng: 3.5,
          description: 'Test zone for photo upload',
        })
        .expect(201);

      const zoneId = createRes.body.id;

      const uploadRes = await supertest(app.getHttpServer())
        .post(`/storage/zones/${zoneId}/photo`)
        .attach('file', uploadedContent, 'test.jpg')
        .expect(201);

      expect(uploadRes.body.photoUrl).toBeDefined();
      expect(typeof uploadRes.body.photoUrl).toBe('string');

      const getRes = await supertest(app.getHttpServer())
        .get(`/zones/${zoneId}`)
        .expect(200);

      expect(getRes.body.photos).toContain(uploadRes.body.photoUrl);

      // Verify file is stored in RustFS with correct content
      const objectKey = uploadRes.body.photoUrl.replace(
        `${rustfsEndpoint}/${RUSTFS_BUCKET}/`,
        '',
      );
      const getHeaders = signS3Get(
        rustfsEndpoint,
        RUSTFS_BUCKET,
        objectKey,
        RUSTFS_ACCESS_KEY,
        RUSTFS_SECRET_KEY,
        RUSTFS_REGION,
      );
      const verifyRes = await axios.get(uploadRes.body.photoUrl, {
        headers: getHeaders,
        responseType: 'arraybuffer',
      });

      expect(verifyRes.status).toBe(200);
      expect(Buffer.from(verifyRes.data)).toEqual(uploadedContent);
    });

    it('rejects request with no file (400)', async () => {
      await supertest(app.getHttpServer())
        .post('/storage/zones/00000000-0000-0000-0000-000000000000/photo')
        .expect(400);
    });

    it('returns 404 for non-existent zone', async () => {
      await supertest(app.getHttpServer())
        .post('/storage/zones/00000000-0000-0000-0000-000000000000/photo')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(404);
    });

    it('returns 400 for malformed zone id', async () => {
      await supertest(app.getHttpServer())
        .post('/storage/zones/not-a-uuid/photo')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(400);
    });
  });
});
