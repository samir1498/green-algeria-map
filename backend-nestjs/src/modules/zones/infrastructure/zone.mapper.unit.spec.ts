import { BadRequestException } from '@nestjs/common';
import { Zone } from '../domain/zone';
import { Coordinates } from '../domain/coordinates.value-object';
import { ZoneMapper } from './zone.mapper';
import { ZoneOrmEntity } from './zone.orm-entity';

describe('ZoneMapper', () => {
  function makeOrmEntity(
    overrides: Partial<ZoneOrmEntity> = {},
  ): ZoneOrmEntity {
    const entity = new ZoneOrmEntity();
    entity.id = 'test-uuid';
    entity.name = 'Test Zone';
    entity.type = 'planting';
    entity.status = 'planned';
    entity.lat = 36.75;
    entity.lng = 3.05;
    entity.targetCount = 20;
    entity.currentCount = 5;
    entity.description = 'A test zone';
    Object.assign(entity, overrides);
    return entity;
  }

  function makeDomain(
    overrides: Partial<Parameters<typeof Zone.create>[0]> = {},
  ): Zone {
    return Zone.create({
      name: 'Test Zone',
      type: 'planting',
      status: 'planned',
      coordinates: new Coordinates(36.75, 3.05),
      description: 'A test zone',
      targetCount: 20,
      currentCount: 5,
      ...overrides,
    });
  }

  describe('toDomain', () => {
    it('maps ORM entity to Zone', () => {
      const entity = makeOrmEntity();
      const zone = ZoneMapper.toDomain(entity);

      expect(zone.id).toBe('test-uuid');
      expect(zone.name).toBe('Test Zone');
      expect(zone.type).toBe('planting');
      expect(zone.status).toBe('planned');
      expect(zone.coordinates.lat).toBe(36.75);
      expect(zone.coordinates.lng).toBe(3.05);
      expect(zone.targetCount).toBe(20);
      expect(zone.currentCount).toBe(5);
      expect(zone.description).toBe('A test zone');
    });

    it('defaults currentCount to 0 when null', () => {
      const entity = makeOrmEntity({ currentCount: undefined });
      const zone = ZoneMapper.toDomain(entity);

      expect(zone.currentCount).toBe(0);
    });

    it('throws BadRequestException for invalid type', () => {
      const entity = makeOrmEntity({ type: 'invalid-type' });

      expect(() => ZoneMapper.toDomain(entity)).toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid status', () => {
      const entity = makeOrmEntity({ status: 'invalid-status' });

      expect(() => ZoneMapper.toDomain(entity)).toThrow(BadRequestException);
    });
  });

  describe('toOrmEntity', () => {
    it('maps Zone to ORM entity', () => {
      const zone = makeDomain({ id: 'domain-id' });
      const entity = ZoneMapper.toOrmEntity(zone);

      expect(entity.id).toBe('domain-id');
      expect(entity.name).toBe('Test Zone');
      expect(entity.type).toBe('planting');
      expect(entity.status).toBe('planned');
      expect(entity.lat).toBe(36.75);
      expect(entity.lng).toBe(3.05);
      expect(entity.targetCount).toBe(20);
      expect(entity.currentCount).toBe(5);
      expect(entity.description).toBe('A test zone');
    });

    it('does not set id when domain has no id', () => {
      const zone = makeDomain({ id: undefined });
      const entity = ZoneMapper.toOrmEntity(zone);

      expect(entity.id).toBeUndefined();
    });
  });

  describe('round-trip', () => {
    it('preserves all fields through toDomain -> toOrmEntity -> toDomain', () => {
      const original = makeOrmEntity();
      const domain = ZoneMapper.toDomain(original);
      const backToOrm = ZoneMapper.toOrmEntity(domain);
      const finalDomain = ZoneMapper.toDomain(backToOrm);

      expect(finalDomain.id).toBe(original.id);
      expect(finalDomain.name).toBe(original.name);
      expect(finalDomain.type).toBe(original.type);
      expect(finalDomain.status).toBe(original.status);
      expect(finalDomain.coordinates.lat).toBe(original.lat);
      expect(finalDomain.coordinates.lng).toBe(original.lng);
      expect(finalDomain.targetCount).toBe(original.targetCount);
      expect(finalDomain.currentCount).toBe(original.currentCount);
      expect(finalDomain.description).toBe(original.description);
    });
  });
});
