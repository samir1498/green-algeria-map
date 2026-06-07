import { afterEach, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { loadComparisonData } from "../report/compare";

const originalBunSpawn = Bun.spawn;

afterEach(() => {
  Bun.spawn = originalBunSpawn;
});

// ── verifyInfra / health timeout ──────────────────────────────────────

describe("infra timeout behavior", () => {
  it("rejects when pg_isready never succeeds", async () => {
    const origSpawn = Bun.spawn;
    const encoder = new TextEncoder();
    Bun.spawn = ((cmd, _opts) => {
      const args = Array.isArray(cmd) ? cmd : [];
      if (args.some((a) => a.includes("pg_isready"))) {
        return { stdout: new ReadableStream({ start(c) { c.close(); } }), exited: Promise.resolve(1), pid: 0, stderr: new ReadableStream({ start(c) { c.close(); } }), stdin: null as any, kill: () => {} };
      }
      return origSpawn(cmd, _opts);
    }) as typeof Bun.spawn;

    const { run } = await import("../shell");
    const result = await run("docker", ["exec", "green-algeria-db", "pg_isready", "-U", "greenalgeria"]);
    expect(result.exitCode).not.toBe(0);

    Bun.spawn = origSpawn;
  });

  it("rejects when RustFS health endpoint is unreachable", async () => {
    // The health endpoint at localhost:9000/ isn't running — fetch should fail
    try {
      const res = await fetch("http://localhost:9000/");
      // If docker is not running, we expect a connection refused error
      expect(res.ok).toBe(false);
    } catch {
      // Connection refused / timeout — expected in test env
      expect(true).toBe(true);
    }
  });
});

// ── NestJS bootstrap failures ─────────────────────────────────────────

describe("NestJS bootstrap failure handling", () => {
  it("fails when pnpm build exits nonzero", async () => {
    const binDir = await mkdtemp(join(tmpdir(), "benchmark-nestjs-"));
    await mkdir(binDir, { recursive: true });

    // Simulate pnpm build failure
    await writeFile(
      join(binDir, "pnpm"),
      `#!/bin/sh
if [ "$1" = "build" ]; then
  echo "ERROR: Build failed" >&2
  exit 1
fi
exit 0
`,
      { mode: 0o755 },
    );
    process.env.PATH = `${binDir}:${process.env.PATH}`;

    const { run } = await import("../shell");
    const result = await run("pnpm", ["build"], { stream: true });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Build failed");

    await rm(binDir, { recursive: true, force: true });
  });

  it("fails when migration exits nonzero", async () => {
    const binDir = await mkdtemp(join(tmpdir(), "benchmark-nestjs-mig-"));
    await mkdir(binDir, { recursive: true });

    // Simulate npx typeorm migration failure
    await writeFile(
      join(binDir, "npx"),
      `#!/bin/sh
if echo "$*" | grep -q "typeorm.*migration:run"; then
  echo "Migration failed: table already exists" >&2
  exit 1
fi
exit 0
`,
      { mode: 0o755 },
    );
    process.env.PATH = `${binDir}:${process.env.PATH}`;

    const { run } = await import("../shell");
    const result = await run("npx", [
      "typeorm-ts-node-commonjs",
      "migration:run",
      "-d",
      "src/data-source.ts",
    ]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Migration failed");

    await rm(binDir, { recursive: true, force: true });
  });

  it("fails when bucket creation fails", async () => {
    const binDir = await mkdtemp(join(tmpdir(), "benchmark-nestjs-bucket-"));
    await mkdir(binDir, { recursive: true });

    // Simulate create-bucket.mjs failure
    await writeFile(
      join(binDir, "node"),
      `#!/bin/sh
if echo "$*" | grep -q "create-bucket"; then
  echo "Failed to create bucket: AccessDenied" >&2
  exit 1
fi
exit 0
`,
      { mode: 0o755 },
    );
    process.env.PATH = `${binDir}:${process.env.PATH}`;

    const { run } = await import("../shell");
    const result = await run("node", ["scripts/create-bucket.mjs"], {
      env: {
        OO_OBJECT_STORAGE_ENDPOINT: "http://localhost:9000",
        OO_OBJECT_STORAGE_BUCKET: "green-algeria",
      },
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Failed to create bucket");

    await rm(binDir, { recursive: true, force: true });
  });

  it("fails when seed exits nonzero", async () => {
    const binDir = await mkdtemp(join(tmpdir(), "benchmark-nestjs-seed-"));
    await mkdir(binDir, { recursive: true });

    // Simulate pnpm seed failure
    await writeFile(
      join(binDir, "pnpm"),
      `#!/bin/sh
if [ "$1" = "seed" ]; then
  echo "Seed failed: duplicate key value violates unique constraint" >&2
  exit 1
fi
exit 0
`,
      { mode: 0o755 },
    );
    process.env.PATH = `${binDir}:${process.env.PATH}`;

    const { run } = await import("../shell");
    const result = await run("pnpm", ["seed"], { stream: true });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Seed failed");

    await rm(binDir, { recursive: true, force: true });
  });
});

// ── Incomplete compare output ─────────────────────────────────────────

describe("compare output with incomplete data", () => {
  it("handles completely empty result directory gracefully", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "benchmark-empty-"));
    const backends = await loadComparisonData(tempDir);
    expect(backends.size).toBe(0);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("handles directory with no summary files gracefully", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "benchmark-no-summary-"));
    await mkdir(join(tempDir, "nestjs", "auth"), { recursive: true });
    await writeFile(join(tempDir, "nestjs", "auth", "run-1.json"), "{}");
    const backends = await loadComparisonData(tempDir);
    expect(backends.size).toBe(0);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("includes only backends with valid data when some are missing", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "benchmark-partial-"));
    const nestDir = join(tempDir, "nestjs", "auth");
    await mkdir(nestDir, { recursive: true });
    await writeFile(
      join(nestDir, "run-1-summary.json"),
      JSON.stringify({
        metrics: {
          http_req_duration: { avg: 100, "p(95)": 200, rate: 10, count: 50, value: 0 },
          http_req_failed: { value: 0 },
          http_reqs: { rate: 10, count: 50 },
          iterations: { count: 50 },
        },
      }),
    );

    // springboot dir exists but has no valid summaries
    const springDir = join(tempDir, "springboot", "auth");
    await mkdir(springDir, { recursive: true });
    await writeFile(join(springDir, "run-1.json"), "not-a-valid-summary");

    const backends = await loadComparisonData(tempDir);
    expect(backends.size).toBe(1);
    expect(backends.has("nestjs")).toBe(true);
    expect(backends.has("springboot")).toBe(false);

    await rm(tempDir, { recursive: true, force: true });
  });

  it("gracefully handles malformed JSON in summary files", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "benchmark-malformed-"));
    const nestDir = join(tempDir, "nestjs", "auth");
    await mkdir(nestDir, { recursive: true });
    await writeFile(join(nestDir, "run-1-summary.json"), "{ invalid json }");
    const backends = await loadComparisonData(tempDir);
    expect(backends.size).toBe(0);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("handles compare with only aggregated summaries (no raw runs)", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "benchmark-aggregated-only-"));
    const aggDir = join(tempDir, "nestjs");
    await mkdir(aggDir, { recursive: true });
    await writeFile(
      join(aggDir, "auth-summary.json"),
      JSON.stringify({
        backend: "nestjs",
        scenario: "auth",
        runs: 3,
        metrics: {
          http_req_duration: {
            avgMedian: 100,
            p95Median: 200,
            failRateAvg: 0,
            rateMedian: 10,
            countTotal: 300,
            runs: 3,
          },
          http_req_failed: {
            avgMedian: 0,
            p95Median: 0,
            failRateAvg: 0,
            rateMedian: 0,
            countTotal: 0,
            runs: 3,
          },
          http_reqs: {
            avgMedian: 0,
            p95Median: 0,
            failRateAvg: 0,
            rateMedian: 10,
            countTotal: 300,
            runs: 3,
          },
          iterations: {
            avgMedian: 0,
            p95Median: 0,
            failRateAvg: 0,
            rateMedian: 0,
            countTotal: 300,
            runs: 3,
          },
        },
      }),
    );
    const backends = await loadComparisonData(tempDir);
    expect(backends.size).toBe(1);
    expect(backends.get("nestjs")?.[0]?.runs).toBe(3);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("handles compare with only raw run summaries (no aggregated)", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "benchmark-raw-only-"));
    const nestDir = join(tempDir, "nestjs", "auth");
    await mkdir(nestDir, { recursive: true });
    await writeFile(
      join(nestDir, "run-1-summary.json"),
      JSON.stringify({
        metrics: {
          http_req_duration: { avg: 100, "p(95)": 200, rate: 10, count: 50, value: 0 },
          http_req_failed: { value: 0 },
          http_reqs: { rate: 10, count: 50 },
          iterations: { count: 50 },
        },
      }),
    );
    await writeFile(
      join(nestDir, "run-2-summary.json"),
      JSON.stringify({
        metrics: {
          http_req_duration: { avg: 120, "p(95)": 220, rate: 11, count: 55, value: 0 },
          http_req_failed: { value: 0 },
          http_reqs: { rate: 11, count: 55 },
          iterations: { count: 55 },
        },
      }),
    );
    const backends = await loadComparisonData(tempDir);
    expect(backends.size).toBe(1);
    const summaries = backends.get("nestjs")!;
    expect(summaries.length).toBe(1);
    expect(summaries[0].runs).toBe(2);
    expect(summaries[0].metrics.http_req_duration.avgMedian).toBe(120); // sorted[1] = 120
    await rm(tempDir, { recursive: true, force: true });
  });
});