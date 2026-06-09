import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { AggregatedMetric, AggregatedSummary, K6Summary } from "../types";
import { status } from "../ui/status";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function aggregateSummaries(backend: string, scenario: string, summaries: K6Summary[]): AggregatedSummary {
  const metrics: Record<string, AggregatedMetric> = {};
  for (const key of Object.keys(summaries[0].metrics)) {
    const avgs = summaries.map((s) => s.metrics[key]?.avg).filter((v): v is number => v !== undefined);
    const p95s = summaries.map((s) => s.metrics[key]?.["p(95)"]).filter((v): v is number => v !== undefined);
    const p90s = summaries.map((s) => s.metrics[key]?.["p(90)"]).filter((v): v is number => v !== undefined);
    const meds = summaries.map((s) => s.metrics[key]?.med).filter((v): v is number => v !== undefined);
    const fails = summaries.map((s) => s.metrics[key]?.value ?? 0);
    const rates = summaries.map((s) => s.metrics[key]?.rate ?? 0);
    const counts = summaries.map((s) => s.metrics[key]?.count ?? 0);
    const values = summaries.map((s) => s.metrics[key]?.value ?? 0);
    const hasRate = rates.some((r) => r > 0);
    const hasCount = counts.some((c) => c > 0);
    const hasValue = values.some((v) => v > 0);

    if (avgs.length > 0 || hasRate || hasCount || hasValue) {
      metrics[key] = {
        avgMedian: avgs.length > 0 ? median(avgs) : 0,
        p95Median: p95s.length > 0 ? median(p95s) : 0,
        p90Median: p90s.length > 0 ? median(p90s) : 0,
        medMedian: meds.length > 0 ? median(meds) : 0,
        failRateAvg: fails.length > 0 ? fails.reduce((a, b) => a + b, 0) / fails.length : 0,
        rateMedian: median(rates),
        countTotal: counts.reduce((a, b) => a + b, 0),
        runs: summaries.length,
      };
    }
  }

  return { backend, scenario, runs: summaries.length, metrics };
}

async function readScenarioSummaries(scenarioDir: string, expectedRuns: number): Promise<K6Summary[]> {
  const summaries: K6Summary[] = [];
  for (let runIndex = 1; runIndex <= expectedRuns; runIndex++) {
    const file = resolve(scenarioDir, `run-${runIndex}-summary.json`);
    if (!(await Bun.file(file).exists())) {
      throw new Error(`Missing benchmark summary: ${file}`);
    }
    summaries.push((await Bun.file(file).json()) as K6Summary);
  }
  return summaries;
}

export function summarizeScenarioRuns(backend: string, scenario: string, summaries: K6Summary[]): AggregatedSummary {
  if (summaries.length === 0) {
    throw new Error(`Cannot aggregate empty benchmark data for ${backend}/${scenario}`);
  }
  return aggregateSummaries(backend, scenario, summaries);
}

export async function aggregateResults(
  backend: string,
  outdir: string,
  scenarios: string[],
  expectedRuns: number,
): Promise<void> {
  await mkdir(outdir, { recursive: true });

  for (const scenario of scenarios) {
    const scenarioDir = resolve(outdir, scenario);
    const summaries = await readScenarioSummaries(scenarioDir, expectedRuns);
    const combined = aggregateSummaries(backend, scenario, summaries);
    await Bun.write(resolve(outdir, `${scenario}-summary.json`), JSON.stringify(combined, null, 2));
    status.setSubtask(`${scenario}: ${summaries.length} runs aggregated`);
  }
}
