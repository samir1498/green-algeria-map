import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { ZoneRepositoryImpl } from '../../src/modules/zones/infrastructure/zone.repository.impl';
import { ZoneRepository } from '../../src/modules/zones/domain/zone.repository';
import { Zone } from '../../src/modules/zones/domain/zone';
import { Coordinates } from '../../src/modules/zones/domain/coordinates.value-object';

describe('ZoneRepository (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let moduleRef: TestingModule;
  let repository: ZoneRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_greenalgeria')
      .withUsername('test_greenalgeria')
      .withPassword('test_greenalgeria')
      .withExposedPorts(5432)
      .start();

    moduleRef = await Test.createTestingModule({
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
        TypeOrmModule.forFeature([ZoneOrmEntity]),
        CqrsModule,
      ],
      providers: [
        {
          provide: ZoneRepository,
          useClass: ZoneRepositoryImpl,
        },
      ],
    }).compile();

    repository = moduleRef.get<ZoneRepository>(ZoneRepository);
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
    if (container) {
      await container.stop();
    }
  });

  describe('save', () => {
    it('creates a new zone with UUID', async () => {
      const zone = Zone.create({
        name: 'Save Test',
        type: 'planting',
        status: 'planned',
        coordinates: new Coordinates(36.0, 3.0),
        description: 'Test',
      });

      const saved = await repository.save(zone);

      expect(saved.id).toBeDefined();
      expect(typeof saved.id).toBe('string');
      expect(saved.name).toBe('Save Test');
    });

    it('preserves all fields on save', async () => {
      const zone = Zone.create({
        name: 'Full Zone',
        type: 'trash',
        status: 'in-progress',
        coordinates: new Coordinates(35.5, 2.5),
        targetCount: 50,
        currentCount: 10,
        description: 'Full test',
      });

      const saved = await repository.save(zone);

      expect(saved.type).toBe('trash');
      expect(saved.status).toBe('in-progress');
      expect(saved.coordinates.lat).toBe(35.5);
      expect(saved.coordinates.lng).toBe(2.5);
      expect(saved.targetCount).toBe(50);
      expect(saved.currentCount).toBe(10);
      expect(saved.description).toBe('Full test');
    });
  });

  describe('findById', () => {
    it('returns saved zone by id', async () => {
      const zone = Zone.create({
        name: 'Lookup Test',
        type: 'cleanup',
        status: 'planned',
        coordinates: new Coordinates(34.0, 1.0),
        description: 'Lookup',
      });
      const saved = await repository.save(zone);

      const found = await repository.findById(saved.id!);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.name).toBe('Lookup Test');
    });

    it('returns null for non-existent id', async () => {
      const found = await repository.findById(
        '00000000-0000-0000-0000-000000000000',
      );

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns zones ordered by name ASC', async () => {
      await repository.save(
        Zone.create({
          name: 'Charlie',
          type: 'planting',
          status: 'planned',
          coordinates: new Coordinates(36.0, 3.0),
          description: 'C',
        }),
      );
      await repository.save(
        Zone.create({
          name: 'Alpha',
          type: 'planting',
          status: 'planned',
          coordinates: new Coordinates(36.0, 3.0),
          description: 'A',
        }),
      );
      await repository.save(
        Zone.create({
          name: 'Bravo',
          type: 'planting',
          status: 'planned',
          coordinates: new Coordinates(36.0, 3.0),
          description: 'B',
        }),
      );

      const zones = await repository.findAll();
      const names = zones.map((z) => z.name);

      const alphaIdx = names.indexOf('Alpha');
      const bravoIdx = names.indexOf('Bravo');
      const charlieIdx = names.indexOf('Charlie');

      expect(alphaIdx).toBeLessThan(bravoIdx);
      expect(bravoIdx).toBeLessThan(charlieIdx);
    });
  });

  describe('remove', () => {
    it('deletes a zone', async () => {
      const zone = Zone.create({
        name: 'Delete Me',
        type: 'planting',
        status: 'planned',
        coordinates: new Coordinates(33.0, 4.0),
        description: 'Delete',
      });
      const saved = await repository.save(zone);

      await repository.remove(saved.id!);
      const found = await repository.findById(saved.id!);

      expect(found).toBeNull();
    });

    it('does not throw for non-existent id', async () => {
      await expect(
        repository.remove('00000000-0000-0000-0000-000000000000'),
      ).resolves.not.toThrow();
    });
  });

  describe('existsByName', () => {
    it('returns true when zone exists', async () => {
      await repository.save(
        Zone.create({
          name: 'Unique Name',
          type: 'planting',
          status: 'planned',
          coordinates: new Coordinates(36.0, 3.0),
          description: 'Test',
        }),
      );

      const exists = await repository.existsByName('Unique Name');

      expect(exists).toBe(true);
    });

    it('returns false when zone does not exist', async () => {
      const exists = await repository.existsByName('Does Not Exist');

      expect(exists).toBe(false);
    });
  });

  describe('round-trip', () => {
    it('save -> findById returns matching fields', async () => {
      const zone = Zone.create({
        name: 'Round Trip',
        type: 'trash',
        status: 'completed',
        coordinates: new Coordinates(37.0, 5.0),
        targetCount: 100,
        currentCount: 100,
        description: 'Round trip test',
      });
      const saved = await repository.save(zone);
      const found = await repository.findById(saved.id!);

      expect(found!.name).toBe('Round Trip');
      expect(found!.type).toBe('trash');
      expect(found!.status).toBe('completed');
      expect(found!.coordinates.lat).toBe(37);
      expect(found!.coordinates.lng).toBe(5);
      expect(found!.targetCount).toBe(100);
      expect(found!.currentCount).toBe(100);
      expect(found!.description).toBe('Round trip test');
    });
  });
});
