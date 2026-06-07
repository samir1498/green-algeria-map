import { defineCommand } from "citty";
import { loadConfig } from "../loader";
import { runPipeline } from "../pipeline/orchestrator";
import type { RunOptions } from "../types";

export const runCommand = defineCommand({
  meta: { name: "run", description: "Run benchmark pipeline" },
  args: {
    backends: { type: "string", alias: "b", description: "Comma-separated backends" },
    scenarios: { type: "string", alias: "s", description: "Comma-separated scenarios" },
    cpus: { type: "string", description: "CPU cores per container" },
    memory: { type: "string", alias: "m", description: "Memory limit" },
    repeats: { type: "string", alias: "r", description: "Runs per scenario" },
    warmup: { type: "string", alias: "w", description: "Warmup iterations" },
    vus: { type: "string", description: "Override VU count" },
    "ramp-duration": { type: "string", description: "Ramp duration" },
    "hold-duration": { type: "string", description: "Hold duration" },
    output: { type: "string", alias: "o", description: "Output directory" },
    "skip-warmup": { type: "boolean", description: "Skip warmup", default: false },
    "dry-run": { type: "boolean", description: "Generate report only", default: false },
  },
  async run({ args }) {
    const config = await loadConfig();
    const opts: RunOptions = {
      backends: args.backends?.split(",") ?? Object.keys(config.backends),
      scenarios: args.scenarios?.split(",") ?? Object.keys(config.scenarios),
      cpus: args.cpus ? Number(args.cpus) : config.defaults.cpus,
      memory: args.memory ?? config.defaults.memory,
      repeats: args.repeats ? Number(args.repeats) : config.defaults.repeats,
      warmup: args.warmup ? Number(args.warmup) : config.defaults.warmup,
      vus: args.vus ? Number(args.vus) : undefined,
      rampDuration: args["ramp-duration"] ?? undefined,
      holdDuration: args["hold-duration"] ?? undefined,
      output: args.output ?? undefined,
      skipWarmup: args["skip-warmup"],
      dryRun: args["dry-run"],
    };
    await runPipeline(opts);
  },
});
