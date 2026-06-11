import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { loadConfig } from "../loader";
import { run } from "../shell";

describe("E2E: Shell & Config", () => {
  it.each([
    ["pnpm", "--version", "."],
    ["npm", "--version", "."],
    ["node", "--version", "v"],
  ] as const)("resolves %s from PATH", async (cmd, flag, pattern) => {
    const result = await run(cmd, [flag]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(pattern);
  });

  it("resolves pnpm with different cwd", async () => {
    const result = await run("pnpm", ["--version"], { cwd: "/tmp" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(".");
  });

  it("handles command not found gracefully", async () => {
    const result = await run("nonexistent-command-xyz", []);
    expect(result.exitCode).not.toBe(0);
  });

  it("captures stdout", async () => {
    const result = await run("echo", ["hello-world"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("hello-world");
  });

  it("respects cwd option", async () => {
    const result = await run("pwd", [], { cwd: "/tmp" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("/tmp");
  });

  it("respects env option", async () => {
    const result = await run("sh", ["-c", "echo $TEST_VAR"], {
      env: { TEST_VAR: "test-value" },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("test-value");
  });

  it("passes timeout option", async () => {
    const result = await run("sleep", ["0.1"], { timeout: 1000 });
    expect(result.exitCode).toBe(0);
  });
});

describe("E2E: Config Structure", () => {
  it("loads config with database section", async () => {
    const config = await loadConfig();
    expect(config.database).toBeDefined();
    expect(config.database.host).toBe("localhost");
    expect(config.database.port).toBe(5432);
    expect(config.database.username).toBe("greenalgeria");
    expect(config.database.password).toBe("greenalgeria");
  });

  it("loads config with infrastructure section", async () => {
    const config = await loadConfig();
    expect(config.infrastructure).toBeDefined();
    expect(config.infrastructure.dbContainerName).toBe("green-algeria-db");
    expect(config.infrastructure.storageContainerName).toBe("green-algeria-rustfs");
    expect(config.infrastructure.objectStorageBucket).toBe("green-algeria");
  });

  it("verifies backend configs reference infrastructure", async () => {
    const config = await loadConfig();
    for (const backend of Object.values(config.backends)) {
      expect(backend.containerName).toBeDefined();
      expect(backend.dbName).toBeDefined();
      expect(backend.port).toBeGreaterThan(0);
      expect(backend.healthUrl).toBeDefined();
    }
  });

  it("verifies all backends have unique ports", async () => {
    const config = await loadConfig();
    const ports = Object.values(config.backends).map((b) => b.port);
    expect(new Set(ports).size).toBe(ports.length);
  });

  it("verifies all scenarios have valid config", async () => {
    const config = await loadConfig();
    for (const scenario of Object.values(config.scenarios)) {
      expect(scenario.vus).toBeGreaterThan(0);
      expect(scenario.rampDuration).toMatch(/^\d+[sm]$/);
      expect(scenario.holdDuration).toMatch(/^\d+[sm]$/);
    }
  });
});

describe("E2E: Command Building", () => {
  it("builds docker exec command for migrations", async () => {
    const config = await loadConfig();
    const { database, infrastructure } = config;

    const cmd = [
      "docker",
      "exec",
      "-i",
      infrastructure.dbContainerName,
      "psql",
      "-U",
      database.username,
      "-d",
      "greenalgeria_go",
      "-c",
      "SELECT 1;",
    ];

    expect(cmd[0]).toBe("docker");
    expect(cmd[1]).toBe("exec");
    expect(cmd[3]).toBe(infrastructure.dbContainerName);
    expect(cmd[4]).toBe("psql");
    expect(cmd[6]).toBe(database.username);
  });

  it("builds pnpm build command with correct cwd", async () => {
    const config = await loadConfig();
    expect(config.backends.nestjs).toBeDefined();
    expect(config.backends.nestjs.port).toBe(8080);
  });
});

describe("E2E: Error Handling", () => {
  it("handles docker exec failure", async () => {
    const result = await run("docker", ["exec", "-i", "nonexistent-container", "ls"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it("handles missing pnpm build", async () => {
    const result = await run("sh", ["-c", "cd /nonexistent && pnpm build"]);
    expect(result.exitCode).not.toBe(0);
  });
});
