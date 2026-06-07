import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { AggregatedMetric, AggregatedSummary, K6Summary } from "../types";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export async function aggregateResults(backend: string, outdir: string, scenarios: string[]): Promise<void> {
  await mkdir(outdir, { recursive: true });

  for (const scenario of scenarios) {
    const scenarioDir = resolve(outdir, scenario);
    const summaries: K6Summary[] = [];

    for await (const file of new Bun.Glob("run-*-summary.json").scan({ cwd: scenarioDir, absolute: true })) {
      try {
        summaries.push(await Bun.file(file).json());
      } catch {
        /* skip */
      }
    }

    if (summaries.length === 0) continue;

    const metrics: Record<string, AggregatedMetric> = {};
    for (const key of Object.keys(summaries[0].metrics)) {
      const avgs = summaries.map((s) => s.metrics[key]?.avg).filter((v): v is number => v !== undefined);
      const p95s = summaries.map((s) => s.metrics[key]?.["p(95)"]).filter((v): v is number => v !== undefined);
      const fails = summaries.map((s) => s.metrics[key]?.value ?? 0);
      const rates = summaries.map((s) => s.metrics[key]?.rate ?? 0);
      const counts = summaries.map((s) => s.metrics[key]?.count ?? 0);

      if (avgs.length > 0) {
        metrics[key] = {
          avgMedian: median(avgs),
          p95Median: median(p95s),
          failRateAvg: fails.length > 0 ? fails.reduce((a, b) => a + b, 0) / fails.length : 0,
          rateMedian: median(rates),
          countTotal: counts.reduce((a, b) => a + b, 0),
          runs: summaries.length,
        };
      }
    }

    const combined: AggregatedSummary = { backend, scenario, runs: summaries.length, metrics };
    await Bun.write(resolve(outdir, `${scenario}-summary.json`), JSON.stringify(combined, null, 2));
    console.log(`    ${scenario}: ${summaries.length} runs aggregated`);
  }
}
