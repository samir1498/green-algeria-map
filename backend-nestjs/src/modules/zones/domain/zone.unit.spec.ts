import { Zone } from './zone';
import { Coordinates } from './coordinates.value-object';

describe('Zone', () => {
  const validCoords = new Coordinates(36.75, 3.05);

  function makeZone(
    overrides: Partial<Parameters<typeof Zone.create>[0]> = {},
  ) {
    return Zone.create({
      name: 'Test Zone',
      type: 'planting',
      status: 'planned',
      coordinates: validCoords,
      description: 'A test zone',
      ...overrides,
    });
  }

  describe('create', () => {
    it('creates a zone with all fields', () => {
      const zone = makeZone();

      expect(zone.name).toBe('Test Zone');
      expect(zone.type).toBe('planting');
      expect(zone.status).toBe('planned');
      expect(zone.description).toBe('A test zone');
    });

    it('defaults currentCount to 0', () => {
      const zone = makeZone();

      expect(zone.currentCount).toBe(0);
    });

    it('accepts explicit currentCount', () => {
      const zone = makeZone({ currentCount: 5 });

      expect(zone.currentCount).toBe(5);
    });

    it('accepts optional id', () => {
      const id = 'test-uuid';
      const zone = makeZone({ id });

      expect(zone.id).toBe(id);
    });
  });

  describe('canStart', () => {
    it('returns true for planned zone', () => {
      const zone = makeZone({ status: 'planned' });

      expect(zone.canStart()).toBe(true);
    });

    it('returns false for in-progress zone', () => {
      const zone = makeZone({ status: 'in-progress' });

      expect(zone.canStart()).toBe(false);
    });

    it('returns false for completed zone', () => {
      const zone = makeZone({ status: 'completed' });

      expect(zone.canStart()).toBe(false);
    });
  });

  describe('markInProgress', () => {
    it('changes status to in-progress', () => {
      const zone = makeZone({ status: 'planned' });
      zone.markInProgress();

      expect(zone.status).toBe('in-progress');
    });

    it('throws if zone is not planned', () => {
      const zone = makeZone({ status: 'in-progress' });

      expect(() => zone.markInProgress()).toThrow(
        'Cannot start zone: current status is "in-progress"',
      );
    });
  });

  describe('canComplete', () => {
    it('returns true when targetCount is reached', () => {
      const zone = makeZone({ targetCount: 10, currentCount: 10 });

      expect(zone.canComplete()).toBe(true);
    });

    it('returns true when currentCount exceeds targetCount', () => {
      const zone = makeZone({ targetCount: 10, currentCount: 15 });

      expect(zone.canComplete()).toBe(true);
    });

    it('returns true when no targetCount is set', () => {
      const zone = makeZone({ targetCount: undefined, currentCount: 0 });

      expect(zone.canComplete()).toBe(true);
    });

    it('returns false when targetCount is not reached', () => {
      const zone = makeZone({ targetCount: 10, currentCount: 5 });

      expect(zone.canComplete()).toBe(false);
    });

    it('returns false when already completed', () => {
      const zone = makeZone({
        status: 'completed',
        targetCount: 10,
        currentCount: 10,
      });

      expect(zone.canComplete()).toBe(false);
    });
  });

  describe('markComplete', () => {
    it('changes status to completed', () => {
      const zone = makeZone({ targetCount: 10, currentCount: 10 });
      zone.markComplete();

      expect(zone.status).toBe('completed');
    });

    it('throws if target not reached', () => {
      const zone = makeZone({ targetCount: 10, currentCount: 5 });

      expect(() => zone.markComplete()).toThrow(
        'Cannot complete zone: target not reached (5/10)',
      );
    });
  });

  describe('updateProgress', () => {
    it('sets currentCount', () => {
      const zone = makeZone();
      zone.updateProgress(7);

      expect(zone.currentCount).toBe(7);
    });

    it('auto-completes when target is reached', () => {
      const zone = makeZone({ targetCount: 10, currentCount: 0 });
      zone.updateProgress(10);

      expect(zone.status).toBe('completed');
    });

    it('throws on negative count', () => {
      const zone = makeZone();

      expect(() => zone.updateProgress(-1)).toThrow('Count cannot be negative');
    });
  });

  describe('toJSON', () => {
    it('returns flat object with lat/lng', () => {
      const zone = makeZone({
        id: 'test-id',
        targetCount: 20,
        currentCount: 5,
      });
      const json = zone.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        name: 'Test Zone',
        type: 'planting',
        status: 'planned',
        lat: 36.75,
        lng: 3.05,
        targetCount: 20,
        currentCount: 5,
        description: 'A test zone',
      });
    });
  });
});
