import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { TestZonesModule } from '../setup/test-zones.module';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateZoneCommand } from '../../src/modules/zones/application/commands/create-zone.command';
import { UpdateZoneCommand } from '../../src/modules/zones/application/commands/update-zone.command';
import { DeleteZoneCommand } from '../../src/modules/zones/application/commands/delete-zone.command';
import { GetAllZonesQuery } from '../../src/modules/zones/application/queries/get-all-zones.query';
import { GetZoneByIdQuery } from '../../src/modules/zones/application/queries/get-zone-by-id.query';
import { ZoneCreatedEvent } from '../../src/modules/zones/application/events/zone-created.event';
import { NotFoundException } from '@nestjs/common';

describe('Zones CQRS (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let eventBus: EventBus;

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
        TestZonesModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    eventBus = module.get(EventBus);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (container) {
      await container.stop();
    }
  });

  describe('CreateZoneCommand', () => {
    it('creates a zone and returns it', async () => {
      const command = new CreateZoneCommand(
        'CQRS Zone',
        'planting',
        'planned',
        36.0,
        3.0,
        undefined,
        undefined,
        'CQRS test',
      );

      const result = await commandBus.execute(command);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('CQRS Zone');
      expect(result.type).toBe('planting');
      expect(result.status).toBe('planned');
      expect(result.coordinates.lat).toBe(36);
      expect(result.coordinates.lng).toBe(3);
      expect(result.description).toBe('CQRS test');
    });

    it('publishes ZoneCreatedEvent', async () => {
      const publishSpy = jest.spyOn(eventBus, 'publish');
      const command = new CreateZoneCommand(
        'Event Zone',
        'trash',
        'planned',
        35.0,
        2.0,
        undefined,
        undefined,
        'Event test',
      );

      await commandBus.execute(command);

      expect(publishSpy).toHaveBeenCalledWith(expect.any(ZoneCreatedEvent));
      const publishedEvent = publishSpy.mock.calls[0][0] as ZoneCreatedEvent;
      expect(publishedEvent.name).toBe('Event Zone');
      expect(publishedEvent.type).toBe('trash');
    });
  });

  describe('GetZoneByIdQuery', () => {
    let zoneId: string;

    beforeAll(async () => {
      const command = new CreateZoneCommand(
        'Lookup CQRS',
        'cleanup',
        'planned',
        34.0,
        1.0,
        undefined,
        undefined,
        'Lookup',
      );
      const result = await commandBus.execute(command);
      zoneId = result.id!;
    });

    it('returns zone by id', async () => {
      const query = new GetZoneByIdQuery(zoneId);
      const result = await queryBus.execute(query);

      expect(result.id).toBe(zoneId);
      expect(result.name).toBe('Lookup CQRS');
    });

    it('throws NotFoundException for non-existent id', async () => {
      const query = new GetZoneByIdQuery(
        '00000000-0000-0000-0000-000000000000',
      );

      await expect(queryBus.execute(query)).rejects.toThrow(NotFoundException);
    });
  });

  describe('GetAllZonesQuery', () => {
    it('returns all zones ordered by name', async () => {
      await commandBus.execute(
        new CreateZoneCommand(
          'Zebra',
          'planting',
          'planned',
          36.0,
          3.0,
          undefined,
          undefined,
          'Z',
        ),
      );
      await commandBus.execute(
        new CreateZoneCommand(
          'Apple',
          'planting',
          'planned',
          36.0,
          3.0,
          undefined,
          undefined,
          'A',
        ),
      );

      const query = new GetAllZonesQuery();

      const zones: Array<{ name: string }> = await queryBus.execute(query);

      const names = zones.map((z) => z.name);

      const appleIdx = names.indexOf('Apple');

      const zebraIdx = names.indexOf('Zebra');

      expect(appleIdx).toBeLessThan(zebraIdx);
    });
  });

  describe('UpdateZoneCommand', () => {
    let zoneId: string;

    beforeAll(async () => {
      const command = new CreateZoneCommand(
        'Update CQRS',
        'planting',
        'planned',
        36.0,
        3.0,
        undefined,
        undefined,
        'Before update',
      );
      const result = await commandBus.execute(command);
      zoneId = result.id!;
    });

    it('updates zone fields', async () => {
      const command = new UpdateZoneCommand(
        zoneId,
        'Updated Name',
        undefined,
        'in-progress',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      const result = await commandBus.execute(command);

      expect(result.name).toBe('Updated Name');
      expect(result.status).toBe('in-progress');
      expect(result.type).toBe('planting');
    });

    it('auto-completes zone when currentCount reaches target', async () => {
      const command = new CreateZoneCommand(
        'Progress Zone',
        'planting',
        'planned',
        36.0,
        3.0,
        10,
        0,
        'Progress test',
      );
      const created = await commandBus.execute(command);

      const updateCommand = new UpdateZoneCommand(
        created.id,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        10,
        undefined,
      );
      const result = await commandBus.execute(updateCommand);

      expect(result.status).toBe('completed');
      expect(result.currentCount).toBe(10);
    });

    it('throws NotFoundException for non-existent id', async () => {
      const command = new UpdateZoneCommand(
        '00000000-0000-0000-0000-000000000000',
        'Nope',
      );

      await expect(commandBus.execute(command)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DeleteZoneCommand', () => {
    let zoneId: string;

    beforeAll(async () => {
      const command = new CreateZoneCommand(
        'Delete CQRS',
        'planting',
        'planned',
        36.0,
        3.0,
        undefined,
        undefined,
        'Delete me',
      );
      const result = await commandBus.execute(command);
      zoneId = result.id!;
    });

    it('deletes a zone', async () => {
      const command = new DeleteZoneCommand(zoneId);
      await commandBus.execute(command);

      const query = new GetZoneByIdQuery(zoneId);
      await expect(queryBus.execute(query)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for non-existent id', async () => {
      const command = new DeleteZoneCommand(
        '00000000-0000-0000-0000-000000000000',
      );

      await expect(commandBus.execute(command)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
