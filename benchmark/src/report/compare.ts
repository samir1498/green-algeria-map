import { basename, resolve } from "node:path";
import type { AggregatedSummary, K6Summary } from "../types";
import { summarizeScenarioRuns } from "./aggregate";

interface ComparisonRow {
  backend: string;
  avg: number;
  p95: number;
  failRate: number;
  iterations: number;
  rps: number;
}

function isAggregatedSummary(data: unknown): data is AggregatedSummary {
  return (
    typeof data === "object" &&
    data !== null &&
    "backend" in data &&
    "scenario" in data &&
    "metrics" in data &&
    "runs" in data
  );
}

function inferBackendAndScenario(pipelineDir: string, file: string): { backend: string; scenario: string } | null {
  const relativePath = file.slice(pipelineDir.length + 1);
  const segments = relativePath.split("/");
  if (segments.length < 2) return null;

  const backend = segments[0];
  const fileName = basename(file);

  if (segments.length >= 3) {
    return { backend, scenario: segments[1] };
  }

  const scenarioFromSummary = fileName
    .replace(/-summary\.json$/, "")
    .replace(/-run-\d+$/, "")
    .replace(/-run-\d+-summary$/, "");
  if (!scenarioFromSummary) return null;
  return { backend, scenario: scenarioFromSummary };
}

export async function loadComparisonData(pipelineDir: string): Promise<Map<string, AggregatedSummary[]>> {
  const grouped = new Map<string, Map<string, { raw: K6Summary[]; aggregated?: AggregatedSummary }>>();

  for await (const file of new Bun.Glob("**/*summary.json").scan({ cwd: pipelineDir, absolute: true })) {
    let parsed: unknown;
    try {
      parsed = await Bun.file(file).json();
    } catch {
      continue;
    }

    const location = inferBackendAndScenario(pipelineDir, file);
    if (!location) continue;

    if (!grouped.has(location.backend)) {
      grouped.set(location.backend, new Map());
    }

    const backendBucket = grouped.get(location.backend)!;
    if (!backendBucket.has(location.scenario)) {
      backendBucket.set(location.scenario, { raw: [] });
    }

    const scenarioBucket = backendBucket.get(location.scenario)!;
    if (isAggregatedSummary(parsed)) {
      scenarioBucket.aggregated = parsed;
    } else if (typeof parsed === "object" && parsed !== null && "metrics" in parsed) {
      scenarioBucket.raw.push(parsed as K6Summary);
    }
  }

  const backends = new Map<string, AggregatedSummary[]>();
  for (const [backend, scenarios] of grouped.entries()) {
    const summaries: AggregatedSummary[] = [];
    for (const [scenario, bucket] of scenarios.entries()) {
      if (bucket.aggregated) {
        summaries.push(bucket.aggregated);
        continue;
      }
      if (bucket.raw.length > 0) {
        summaries.push(summarizeScenarioRuns(backend, scenario, bucket.raw));
      }
    }
    if (summaries.length > 0) {
      backends.set(backend, summaries);
    }
  }

  return backends;
}

function buildComparison(summaries: AggregatedSummary[]): Record<string, ComparisonRow[]> {
  const result: Record<string, ComparisonRow[]> = {};
  for (const summary of summaries) {
    const scenario = summary.scenario;
    if (!result[scenario]) result[scenario] = [];
    const duration = summary.metrics.http_req_duration;
    const reqs = summary.metrics.http_reqs;
    const iterations = summary.metrics.iterations;
    if (duration) {
      result[scenario].push({
        backend: summary.backend,
        avg: duration.avgMedian,
        p95: duration.p95Median,
        failRate: duration.failRateAvg,
        iterations: iterations?.countTotal ?? 0,
        rps: reqs?.rateMedian ?? 0,
      });
    }
  }
  return result;
}

export function determineWinner(rows: ComparisonRow[]): string | null {
  if (rows.length < 2) return null;
  let best = rows[0];
  let bestScore = best.failRate >= 0.05 ? 999999 : best.avg + best.p95;
  for (const row of rows.slice(1)) {
    const score = row.failRate >= 0.05 ? 999999 : row.avg + row.p95;
    if (score < bestScore) {
      best = row;
      bestScore = score;
    }
  }
  return best.backend;
}

export function formatTable(backends: Map<string, AggregatedSummary[]>): string {
  const lines: string[] = [];
  const comparison = buildComparison([...backends.values()].flat());
  lines.push("", "  Benchmark Comparison", "");

  for (const [scenario, rows] of Object.entries(comparison)) {
    lines.push(`  Scenario: ${scenario}`);
    lines.push("  ┌──────────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐");
    lines.push("  │ Backend          │     Avg (ms) │    p95 (ms)  │    Failed %   │  Iterations  │   Req/s      │");
    lines.push("  ├──────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤");
    for (const row of rows) {
      lines.push(
        `  │ ${row.backend.padEnd(16)} │ ${String(Math.round(row.avg)).padStart(12)} │ ${String(Math.round(row.p95)).padStart(12)} │ ${(row.failRate * 100).toFixed(1).padStart(11)}% │ ${String(Math.round(row.iterations)).padStart(12)} │ ${String(Math.round(row.rps)).padStart(12)} │`,
      );
    }
    lines.push("  └──────────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘");
    const winner = determineWinner(rows);
    if (winner) lines.push(`  Winner: ${winner}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function formatMarkdown(backends: Map<string, AggregatedSummary[]>): string {
  const lines: string[] = [];
  const comparison = buildComparison([...backends.values()].flat());
  for (const [scenario, rows] of Object.entries(comparison)) {
    lines.push(
      `### ${scenario.charAt(0).toUpperCase() + scenario.slice(1)}`,
      "",
      "| Backend | avg | p95 | fail | iter | req/s |",
      "|---|---|---|---|---|---|",
    );
    for (const row of rows) {
      lines.push(
        `| ${row.backend} | ${Math.round(row.avg)}ms | ${Math.round(row.p95)}ms | ${(row.failRate * 100).toFixed(1)}% | ${Math.round(row.iterations)} | ${Math.round(row.rps)} |`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function formatJson(backends: Map<string, AggregatedSummary[]>): string {
  return JSON.stringify(Object.fromEntries(backends), null, 2);
}
