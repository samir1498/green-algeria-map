import { describe, expect, it } from "bun:test";
import { loadConfig } from "../loader";

describe("loadConfig", () => {
  it("loads bench.config.json", async () => {
    const config = await loadConfig();
    expect(config.defaults).toBeDefined();
    expect(config.defaults.cpus).toBe(1);
    expect(config.defaults.memory).toBe("512m");
    expect(config.defaults.repeats).toBe(1);
    expect(config.defaults.warmup).toBe(10);
    expect(config.defaults.heapRatio).toBe(0.5);
  });

  it("has profiles", async () => {
    const config = await loadConfig();
    expect(config.profiles).toBeDefined();
    expect(Object.keys(config.profiles!)).toEqual(["full"]);
    expect(config.profiles!.full.repeats).toBe(3);
  });

  it("has all backends", async () => {
    const config = await loadConfig();
    expect(Object.keys(config.backends)).toEqual(["nestjs", "springboot", "go"]);
    expect(config.backends.nestjs.port).toBe(8080);
    expect(config.backends.springboot.port).toBe(8081);
    expect(config.backends.go.port).toBe(8082);
  });

  it("has all scenarios", async () => {
    const config = await loadConfig();
    expect(Object.keys(config.scenarios)).toEqual(["auth", "zones", "mix"]);
    expect(config.scenarios.auth.vus).toBe(20);
    expect(config.scenarios.zones.vus).toBe(40);
    expect(config.scenarios.mix.vus).toBe(30);
  });
});
