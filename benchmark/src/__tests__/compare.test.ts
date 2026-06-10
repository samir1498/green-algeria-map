import { describe, expect, it } from "bun:test";
import { formatTable } from "../report/compare";
import type { AggregatedMetric, AggregatedSummary } from "../types";

function am(overrides: Partial<AggregatedMetric>): AggregatedMetric {
  return {
    avgMedian: 0,
    p95Median: 0,
    p90Median: 0,
    medMedian: 0,
    failRateAvg: 0,
    rateMedian: 0,
    countTotal: 0,
    runs: 1,
    ...overrides,
  };
}

describe("formatTable", () => {
  it("handles empty backends map", () => {
    const output = formatTable(new Map());
    expect(output).toContain("Benchmark Comparison");
  });

  it("includes winner with multiple backends", () => {
    const go: AggregatedSummary = {
      backend: "go",
      scenario: "auth",
      runs: 1,
      metrics: {
        http_req_duration: am({ avgMedian: 1, medMedian: 1, p95Median: 2, rateMedian: 100, countTotal: 100 }),
        http_req_failed: am({ failRateAvg: 0 }),
        http_reqs: am({ rateMedian: 100, countTotal: 100 }),
        iterations: am({ countTotal: 100 }),
      },
    };
    const nestjs: AggregatedSummary = {
      backend: "nestjs",
      scenario: "auth",
      runs: 1,
      metrics: {
        http_req_duration: am({ avgMedian: 100, medMedian: 90, p95Median: 200, rateMedian: 10, countTotal: 10 }),
        http_req_failed: am({ failRateAvg: 0 }),
        http_reqs: am({ rateMedian: 10, countTotal: 10 }),
        iterations: am({ countTotal: 10 }),
      },
    };
    const output = formatTable(
      new Map([
        ["go", [go]],
        ["nestjs", [nestjs]],
      ]),
    );
    expect(output).toContain("🥇 Winner: go");
  });

  it("penalizes backends with high failure rate", () => {
    const go: AggregatedSummary = {
      backend: "go",
      scenario: "auth",
      runs: 1,
      metrics: {
        http_req_duration: am({ avgMedian: 1, medMedian: 1, p95Median: 2, rateMedian: 100, countTotal: 100 }),
        http_req_failed: am({ failRateAvg: 0.6 }),
        http_reqs: am({ rateMedian: 100, countTotal: 100 }),
        iterations: am({ countTotal: 100 }),
      },
    };
    const nestjs: AggregatedSummary = {
      backend: "nestjs",
      scenario: "auth",
      runs: 1,
      metrics: {
        http_req_duration: am({ avgMedian: 100, medMedian: 90, p95Median: 200, rateMedian: 10, countTotal: 10 }),
        http_req_failed: am({ failRateAvg: 0 }),
        http_reqs: am({ rateMedian: 10, countTotal: 10 }),
        iterations: am({ countTotal: 10 }),
      },
    };
    const output = formatTable(
      new Map([
        ["go", [go]],
        ["nestjs", [nestjs]],
      ]),
    );
    expect(output).toContain("🥇 Winner: nestjs");
  });
});
