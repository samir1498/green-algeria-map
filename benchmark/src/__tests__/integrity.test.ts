import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runScenario } from "../k6/runner";
import { aggregateResults } from "../report/aggregate";
import { formatTable, loadComparisonData } from "../report/compare";

const originalSpawn = Bun.spawn;
const originalPath = process.env.PATH ?? "";

beforeEach(() => {
  Bun.spawn = originalSpawn;
});

afterEach(() => {
  process.env.PATH = originalPath;
  Bun.spawn = originalSpawn;
});

async function createTempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function rawSummary(avg: number, p95: number, rate: number, count: number): Record<string, unknown> {
  return {
    metrics: {
      http_req_duration: { avg, "p(95)": p95, rate, count, value: 0 },
      http_req_failed: { value: 0 },
      http_reqs: { rate, count },
      iterations: { count },
    },
  };
}

describe("benchmark integrity", () => {
  it("fails scenario runs when k6 exits nonzero", async () => {
    const tempDir = await createTempDir("benchmark-k6-");
    const encoder = new TextEncoder();
    Bun.spawn = (() => {
      return {
        stdout: null,
        stderr: new ReadableStream({
          start(c) {
            c.enqueue(encoder.encode("k6-failed\n"));
            c.close();
          },
        }),
        exited: Promise.resolve(2),
        pid: 0,
        stdin: null as any,
        kill: () => {},
      };
    }) as unknown as typeof Bun.spawn;

    await expect(
      runScenario(
        "nestjs",
        {
          port: 8080,
          apiPrefix: "",
          healthUrl: "http://localhost:8080/health",
          profile: "nestjs",
          dbName: "greenalgeria_nestjs",
          containerName: "green-algeria-nestjs",
        },
        "auth",
        { vus: 1, rampDuration: "1s", holdDuration: "1s" },
        join(tempDir, "results"),
        1,
      ),
    ).rejects.toThrow("failed");

    Bun.spawn = originalSpawn;
    await rm(tempDir, { recursive: true, force: true });
  });

  it("fails aggregation when a run summary is missing", async () => {
    const tempDir = await createTempDir("benchmark-aggregate-");
    const backendDir = join(tempDir, "nestjs");
    const scenarioDir = join(backendDir, "auth");
    await writeJson(join(scenarioDir, "run-1-summary.json"), rawSummary(10, 20, 1, 5));

    await expect(aggregateResults("nestjs", backendDir, ["auth"], 2)).rejects.toThrow("Missing benchmark summary");

    await rm(tempDir, { recursive: true, force: true });
  });

  it("loads raw and aggregated summary formats", async () => {
    const tempDir = await createTempDir("benchmark-compare-");
    const nestDir = join(tempDir, "nestjs", "auth");
    await writeJson(join(nestDir, "run-1-summary.json"), rawSummary(100, 200, 10, 50));
    await writeJson(join(nestDir, "run-2-summary.json"), rawSummary(50, 100, 12, 55));

    const springDir = join(tempDir, "springboot");
    await writeJson(join(springDir, "auth-summary.json"), {
      backend: "springboot",
      scenario: "auth",
      runs: 2,
      metrics: {
        http_req_duration: {
          avgMedian: 75,
          p95Median: 150,
          failRateAvg: 0,
          rateMedian: 11,
          countTotal: 105,
          runs: 2,
        },
        http_req_failed: {
          avgMedian: 0,
          p95Median: 0,
          failRateAvg: 0,
          rateMedian: 0,
          countTotal: 0,
          runs: 2,
        },
        http_reqs: {
          avgMedian: 0,
          p95Median: 0,
          failRateAvg: 0,
          rateMedian: 11,
          countTotal: 105,
          runs: 2,
        },
        iterations: {
          avgMedian: 0,
          p95Median: 0,
          failRateAvg: 0,
          rateMedian: 0,
          countTotal: 105,
          runs: 2,
        },
      },
    });

    const backends = await loadComparisonData(tempDir);
    expect(backends.size).toBe(2);
    expect(backends.get("nestjs")?.[0]?.runs).toBe(2);
    expect(backends.get("springboot")?.[0]?.scenario).toBe("auth");
    expect(formatTable(backends)).toContain("Benchmark Comparison");

    await rm(tempDir, { recursive: true, force: true });
  });
});
