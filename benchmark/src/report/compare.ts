import { basename, resolve } from "node:path";
import type { AggregatedSummary, K6Summary } from "../types";
import { summarizeScenarioRuns } from "./aggregate";

const TROPHIES = ["🥇", "🥈", "🥉"];

interface ComparisonRow {
  backend: string;
  avg: number;
  p95: number;
  failRate: number;
  iterations: number;
  rps: number;
  avgCpu?: number;
  avgMemMb?: number;
}

interface DockerStats {
  avgCpu: number;
  avgMemMb: number;
}

function parseMemMb(memStr: string): number {
  const match = memStr.match(/^([\d.]+)\s*(MiB|GiB|KiB)$/);
  if (!match) return 0;
  const val = Number.parseFloat(match[1]);
  switch (match[2]) {
    case "GiB":
      return val * 1024;
    case "KiB":
      return val / 1024;
    default:
      return val;
  }
}

export async function loadDockerStats(pipelineDir: string): Promise<Record<string, DockerStats>> {
  const result: Record<string, DockerStats> = {};
  for await (const file of new Bun.Glob("*-docker-stats.log").scan({ cwd: pipelineDir, absolute: true })) {
    const content = await Bun.file(file).text();
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length === 0) continue;

    const backend = basename(file).replace(/-docker-stats\.log$/, "");
    let totalCpu = 0;
    let totalMemMb = 0;

    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length < 3) continue;
      const cpu = Number.parseFloat(parts[1]?.replace("%", "") ?? "0");
      const memMatch = parts[2]?.match(/^([\d.]+)\s*(MiB|GiB|KiB)/);
      if (memMatch) {
        totalCpu += cpu;
        totalMemMb += parseMemMb(memMatch[0]);
      }
    }

    result[backend] = {
      avgCpu: Math.round((totalCpu / lines.length) * 100) / 100,
      avgMemMb: Math.round((totalMemMb / lines.length) * 100) / 100,
    };
  }
  return result;
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
      if (parsed.metrics.http_reqs?.countTotal !== undefined && parsed.metrics.http_reqs.countTotal > 0) {
        scenarioBucket.aggregated = parsed;
      }
      continue;
    }
    if (typeof parsed === "object" && parsed !== null && "metrics" in parsed) {
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

function buildComparison(
  summaries: AggregatedSummary[],
  stats: Record<string, DockerStats>,
): Record<string, ComparisonRow[]> {
  const result: Record<string, ComparisonRow[]> = {};
  for (const summary of summaries) {
    const scenario = summary.scenario;
    if (!result[scenario]) result[scenario] = [];
    const duration = summary.metrics.http_req_duration;
    const reqs = summary.metrics.http_reqs;
    const iterations = summary.metrics.iterations;
    const st = stats[summary.backend];
    if (duration) {
      result[scenario].push({
        backend: summary.backend,
        avg: duration.avgMedian,
        p95: duration.p95Median,
        failRate: duration.failRateAvg,
        iterations: iterations?.countTotal ?? 0,
        rps: reqs?.rateMedian ?? 0,
        avgCpu: st?.avgCpu,
        avgMemMb: st?.avgMemMb,
      });
    }
  }
  return result;
}

export function determineWinner(rows: ComparisonRow[]): string | null {
  if (rows.length < 2) return null;
  return rankRows(rows)[0].backend;
}

function rankRows(rows: ComparisonRow[]): ComparisonRow[] {
  return [...rows].sort((a, b) => {
    const aFail = a.failRate >= 0.05 ? 999999 : a.avg + a.p95;
    const bFail = b.failRate >= 0.05 ? 999999 : b.avg + b.p95;
    return aFail - bFail;
  });
}

function formatVal(v: number | undefined, digits = 0): string {
  return v !== undefined ? String(Math.round(v * 10 ** digits) / 10 ** digits) : "—";
}

export function formatTable(
  backends: Map<string, AggregatedSummary[]>,
  stats: Record<string, DockerStats> = {},
): string {
  const lines: string[] = [];
  const comparison = buildComparison([...backends.values()].flat(), stats);
  lines.push("", "  Benchmark Comparison", "");

  for (const [scenario, rows] of Object.entries(comparison)) {
    const ranked = rankRows(rows);
    lines.push(`  Scenario: ${scenario}`);
    lines.push(
      "  ┌──────────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐",
    );
    lines.push(
      "  │ Backend          │     Avg (ms) │    p95 (ms)  │    Failed %   │  Iterations  │   Req/s      │   CPU (avg)  │  Mem (avg)   │",
    );
    lines.push(
      "  ├──────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤",
    );
    for (let i = 0; i < ranked.length; i++) {
      const row = ranked[i];
      const trophy = TROPHIES[i] ?? "";
      const cpuStr = row.avgCpu !== undefined ? `${row.avgCpu.toFixed(1)}%` : "—";
      const memStr = row.avgMemMb !== undefined ? `${row.avgMemMb.toFixed(0)}MiB` : "—";
      lines.push(
        `  │ ${trophy} ${row.backend.padEnd(13)} │ ${String(Math.round(row.avg)).padStart(12)} │ ${String(Math.round(row.p95)).padStart(12)} │ ${(row.failRate * 100).toFixed(1).padStart(11)}% │ ${String(Math.round(row.iterations)).padStart(12)} │ ${String(Math.round(row.rps)).padStart(12)} │ ${cpuStr.padStart(12)} │ ${memStr.padStart(12)} │`,
      );
    }
    lines.push(
      "  └──────────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘",
    );
    const winner = ranked.length > 1 ? ranked[0].backend : null;
    if (winner) lines.push(`  ${TROPHIES[0]} Winner: ${winner}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function formatMarkdown(
  backends: Map<string, AggregatedSummary[]>,
  stats: Record<string, DockerStats> = {},
): string {
  const lines: string[] = [];
  const comparison = buildComparison([...backends.values()].flat(), stats);
  for (const [scenario, rows] of Object.entries(comparison)) {
    const ranked = rankRows(rows);
    lines.push(
      `### ${scenario.charAt(0).toUpperCase() + scenario.slice(1)}`,
      "",
      "| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |",
      "|---|---|---|---|---|---|---|---|---|",
    );
    for (let i = 0; i < ranked.length; i++) {
      const row = ranked[i];
      const trophy = TROPHIES[i] ?? `#${i + 1}`;
      const cpuStr = row.avgCpu !== undefined ? `${row.avgCpu.toFixed(1)}%` : "—";
      const memStr = row.avgMemMb !== undefined ? `${row.avgMemMb.toFixed(0)}MiB` : "—";
      lines.push(
        `| ${trophy} | ${row.backend} | ${Math.round(row.avg)}ms | ${Math.round(row.p95)}ms | ${(row.failRate * 100).toFixed(1)}% | ${Math.round(row.iterations)} | ${Math.round(row.rps)} | ${cpuStr} | ${memStr} |`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function formatJson(backends: Map<string, AggregatedSummary[]>): string {
  return JSON.stringify(Object.fromEntries(backends), null, 2);
}
