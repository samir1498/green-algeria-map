import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineCommand } from "citty";
import { consola } from "consola";
import { waitForHealth } from "../health";
import { runScenario, runWarmup } from "../k6/runner";
import { loadConfig } from "../loader";
import { banner, formatDuration, timer } from "../logger";
import type { RunOptions } from "../types";

export const singleCommand = defineCommand({
  meta: { name: "single", description: "Benchmark a single backend (infra must be running)" },
  args: {
    backend: { type: "positional", required: true, description: "Backend name" },
    scenarios: { type: "string", alias: "s", description: "Comma-separated scenarios" },
    repeats: { type: "string", alias: "r", description: "Runs per scenario" },
    warmup: { type: "string", alias: "w", description: "Warmup iterations" },
    vus: { type: "string", description: "Override VU count" },
    "ramp-duration": { type: "string", description: "Ramp duration" },
    "hold-duration": { type: "string", description: "Hold duration" },
    output: { type: "string", alias: "o", description: "Output directory" },
    "skip-warmup": { type: "boolean", description: "Skip warmup", default: false },
  },
  async run({ args }) {
    const config = await loadConfig();
    const backendName = args.backend;
    const backend = config.backends[backendName];
    if (!backend) throw new Error(`Unknown backend: ${backendName}`);

    const scenarios = args.scenarios?.split(",") ?? Object.keys(config.scenarios);
    const repeats = args.repeats ? Number(args.repeats) : config.defaults.repeats;
    const warmup = args.warmup ? Number(args.warmup) : config.defaults.warmup;
    const outdir = args.output ?? resolve(import.meta.dir, `../../../results/${Date.now()}-${backendName}`);
    await mkdir(outdir, { recursive: true });

    banner(
      `Benchmark: ${backendName}\n  Port: ${backend.port} | Scenarios: ${scenarios.join(", ")} | Repeats: ${repeats}`,
    );

    const t = timer();
    await waitForHealth(backend.healthUrl, backendName);

    if (!args["skip-warmup"]) await runWarmup(backendName, backend, warmup);

    for (const scenario of scenarios) {
      const scenarioConfig = config.scenarios[scenario];
      if (!scenarioConfig) {
        throw new Error(`Unknown scenario: ${scenario}. Available: ${Object.keys(config.scenarios).join(", ")}`);
      }
      const scenarioOutdir = resolve(outdir, scenario);
      for (let i = 1; i <= repeats; i++) {
        await runScenario(
          backendName,
          backend,
          scenario,
          scenarioConfig,
          scenarioOutdir,
          i,
          args.vus ? Number(args.vus) : undefined,
          args["ramp-duration"] ?? undefined,
          args["hold-duration"] ?? undefined,
        );
      }
    }

    consola.box(`Done in ${formatDuration(t.stop())}\n  Results: ${outdir}`);
  },
});
