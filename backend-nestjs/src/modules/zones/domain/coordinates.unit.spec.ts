import { Coordinates } from './coordinates.value-object';

describe('Coordinates', () => {
  it('accepts valid coordinates', () => {
    const coords = new Coordinates(36.75, 3.05);

    expect(coords.lat).toBe(36.75);
    expect(coords.lng).toBe(3.05);
  });

  it('accepts lat boundary -90', () => {
    expect(() => new Coordinates(-90, 0)).not.toThrow();
  });

  it('accepts lat boundary 90', () => {
    expect(() => new Coordinates(90, 0)).not.toThrow();
  });

  it('throws for lat > 90', () => {
    expect(() => new Coordinates(91, 0)).toThrow(
      'Latitude must be between -90 and 90, got 91',
    );
  });

  it('throws for lat < -90', () => {
    expect(() => new Coordinates(-91, 0)).toThrow(
      'Latitude must be between -90 and 90, got -91',
    );
  });

  it('accepts lng boundary -180', () => {
    expect(() => new Coordinates(0, -180)).not.toThrow();
  });

  it('accepts lng boundary 180', () => {
    expect(() => new Coordinates(0, 180)).not.toThrow();
  });

  it('throws for lng > 180', () => {
    expect(() => new Coordinates(0, 181)).toThrow(
      'Longitude must be between -180 and 180, got 181',
    );
  });

  it('throws for lng < -180', () => {
    expect(() => new Coordinates(0, -181)).toThrow(
      'Longitude must be between -180 and 180, got -181',
    );
  });
});
