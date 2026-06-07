import { describe, expect, it } from "bun:test";
import { determineWinner } from "../report/compare";

describe("determineWinner", () => {
  it("returns null for less than 2 rows", () => {
    expect(determineWinner([])).toBeNull();
    expect(determineWinner([{ backend: "go", avg: 100, p95: 200, failRate: 0, iterations: 100, rps: 50 }])).toBeNull();
  });

  it("picks lowest avg+p95 when failure rates are low", () => {
    const rows = [
      { backend: "nestjs", avg: 743, p95: 1708, failRate: 0, iterations: 824, rps: 19 },
      { backend: "go", avg: 274, p95: 680, failRate: 0, iterations: 2215, rps: 55 },
      { backend: "springboot", avg: 318, p95: 1005, failRate: 0, iterations: 1907, rps: 48 },
    ];
    expect(determineWinner(rows)).toBe("go");
  });

  it("penalizes backends with high failure rate", () => {
    const rows = [
      { backend: "nestjs", avg: 743, p95: 1708, failRate: 0, iterations: 824, rps: 19 },
      { backend: "go", avg: 109, p95: 441, failRate: 0.6, iterations: 522, rps: 80 },
    ];
    expect(determineWinner(rows)).toBe("nestjs");
  });
});
