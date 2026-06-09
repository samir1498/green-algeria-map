import { describe, expect, it, vi } from "vitest";
import { GetAllZonesHandler } from "./get-all-zones.handler";
import { GetZoneByIdHandler } from "./get-zone-by-id.handler";
import { NotFoundException } from "@nestjs/common";

const mockFindAll = vi.fn();
const mockFindById = vi.fn();
const mockSave = vi.fn();
const mockRemove = vi.fn();

const mockRepo = { findAll: mockFindAll, findById: mockFindById, save: mockSave, remove: mockRemove };

const getAll = new GetAllZonesHandler(mockRepo as any);
const getById = new GetZoneByIdHandler(mockRepo as any);

beforeEach(() => vi.resetAllMocks());

describe("GetAllZonesHandler", () => {
  it("returns all zones from repository", async () => {
    mockFindAll.mockResolvedValue(["zone1", "zone2"]);
    const result = await getAll.execute();
    expect(result).toHaveLength(2);
    expect(mockFindAll).toHaveBeenCalledTimes(1);
  });
});

describe("GetZoneByIdHandler", () => {
  it("returns zone when found", async () => {
    mockFindById.mockResolvedValue({ id: "z-1", name: "Park" });
    const result = await getById.execute({ id: "z-1" } as any);
    expect(result).toMatchObject({ id: "z-1", name: "Park" });
  });

  it("throws NotFoundException when not found", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(getById.execute({ id: "missing" } as any)).rejects.toThrow(NotFoundException);
  });
});
