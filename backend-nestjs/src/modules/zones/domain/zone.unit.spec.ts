import { describe, expect, it } from "vitest";
import { Zone } from "./zone";
import { Coordinates } from "./coordinates.value-object";
import {
  CannotCompleteZoneError,
  CannotStartZoneError,
  NegativeCountError,
} from "./zone-errors";

function makeZone(overrides?: Partial<Parameters<typeof Zone.create>[0]>) {
  return Zone.create({
    name: "Test Zone",
    type: "planting",
    status: "planned",
    coordinates: new Coordinates(36.75, 3.05),
    targetCount: 100,
    currentCount: 0,
    description: "A test zone",
    ...overrides,
  });
}

describe("Zone", () => {
  it("creates with defaults", () => {
    const zone = Zone.create({
      name: "Park", type: "cleanup", status: "planned",
      coordinates: new Coordinates(36.7, 3.0), description: "",
    });
    expect(zone).toMatchObject({ name: "Park", type: "cleanup", status: "planned", currentCount: 0, volunteerCount: 0, description: "" });
    expect(zone.photos).toEqual([]);
  });

  describe("coordinates", () => {
    it.each([
      [-91, 0, /Latitude/], [91, 0, /Latitude/],
      [0, -181, /Longitude/], [0, 181, /Longitude/],
    ])("rejects (%i, %i)", (lat, lng, pattern) => {
      expect(() => new Coordinates(lat, lng)).toThrow(pattern);
    });

    it.each([
      [-90, -180], [90, 180], [0, 0], [36.75, 3.05],
    ])("accepts (%i, %i)", (lat, lng) => {
      expect(() => new Coordinates(lat, lng)).not.toThrow();
    });
  });

  describe("status transitions", () => {
    it("planned → in-progress → completed with matching counts", () => {
      const zone = makeZone({ currentCount: 100 });
      expect(zone.canStart()).toBe(true);
      zone.markInProgress();
      expect(zone.status).toBe("in-progress");
      expect(zone.canStart()).toBe(false);
      zone.markComplete();
      expect(zone.status).toBe("completed");
      expect(zone.canComplete()).toBe(false);
    });

    it("markInProgress throws if already started or completed", () => {
      const inProgress = makeZone(); inProgress.markInProgress();
      expect(() => inProgress.markInProgress()).toThrow(CannotStartZoneError);
      const completed = makeZone({ currentCount: 100 }); completed.markComplete();
      expect(() => completed.markInProgress()).toThrow(CannotStartZoneError);
    });

    it("markComplete throws when current < target", () => {
      expect(() => makeZone({ currentCount: 50 }).markComplete()).toThrow(CannotCompleteZoneError);
    });

    it("markComplete succeeds when target undefined", () => {
      const zone = makeZone({ targetCount: undefined, currentCount: 0 });
      zone.markComplete();
      expect(zone.status).toBe("completed");
    });
  });

  describe("progress", () => {
    it("updateProgress auto-completes on target reached, does not revert completed status", () => {
      const z = makeZone();
      z.updateProgress(100);
      expect(z.currentCount).toBe(100);
      expect(z.status).toBe("completed");
      z.updateProgress(50);
      expect(z.currentCount).toBe(50);
      expect(z.status).toBe("completed");
    });

    it("updateProgress throws on negative", () => {
      expect(() => makeZone().updateProgress(-1)).toThrow(NegativeCountError);
    });
  });

  describe("photos", () => {
    it.each(["", "   ", "not-a-url"])("rejects invalid: %j", (url) => {
      const zone = makeZone();
      zone.addPhoto(url);
      expect(zone.photos).toHaveLength(0);
    });

    it("rejects duplicates and getter returns a copy", () => {
      const zone = makeZone();
      zone.addPhoto("https://example.com/p.jpg");
      zone.addPhoto("https://example.com/p.jpg");
      expect(zone.photos).toHaveLength(1);
      const copy = zone.photos;
      copy.push("x");
      expect(zone.photos).toHaveLength(1);
    });

    it("removePhoto removes existing URL", () => {
      const zone = makeZone();
      zone.addPhoto("https://example.com/p.jpg");
      zone.removePhoto("https://example.com/p.jpg");
      expect(zone.photos).toHaveLength(0);
    });
  });

  it("updates all modifiable fields", () => {
    const zone = makeZone();
    zone.rename("X");
    zone.updateType("trash");
    zone.reposition(35, 2);
    zone.updateDescription("D");
    zone.updateOrganizerContact("c@e.com");
    zone.updateTargetCount(200);
    zone.updateTreeSpecies("pine");
    expect(zone).toMatchObject({
      name: "X", type: "trash", description: "D",
      organizerContact: "c@e.com", targetCount: 200, treeSpecies: "pine",
    });
    expect(zone.coordinates).toMatchObject({ lat: 35, lng: 2 });
  });

  it("registerVolunteer increments count", () => {
    const zone = makeZone();
    expect(zone.volunteerCount).toBe(0);
    zone.registerVolunteer();
    zone.registerVolunteer();
    expect(zone.volunteerCount).toBe(2);
  });

  it("exports error classes", async () => {
    const { InvalidZoneTypeError, InvalidZoneStatusError } = await import("./zone-errors");
    expect(() => { throw new InvalidZoneTypeError("bad"); }).toThrow("Invalid zone type: bad");
    expect(() => { throw new InvalidZoneStatusError("bad"); }).toThrow("Invalid zone status: bad");
  });
});
