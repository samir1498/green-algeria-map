import { defineCommand } from "citty";
import { loadConfig } from "../loader";
import { runPipeline } from "../pipeline/orchestrator";
import type { ProfileConfig, RunOptions } from "../types";

function resolveProfile(
  config: { profiles?: Record<string, ProfileConfig> },
  profileName?: string,
): ProfileConfig | undefined {
  if (!profileName) return undefined;
  const profile = config.profiles?.[profileName];
  if (!profile)
    throw new Error(`Unknown profile: "${profileName}". Available: ${Object.keys(config.profiles ?? {}).join(", ")}`);
  return profile;
}

export const runCommand = defineCommand({
  meta: { name: "run", description: "Run benchmark pipeline" },
  args: {
    backends: { type: "string", alias: "b", description: "Comma-separated backends" },
    scenarios: { type: "string", alias: "s", description: "Comma-separated scenarios" },
    profile: { type: "string", alias: "P", description: "Config profile (e.g. 'full')" },
    cpus: { type: "string", description: "CPU cores per container" },
    memory: { type: "string", alias: "m", description: "Memory limit" },
    repeats: { type: "string", alias: "r", description: "Runs per scenario" },
    warmup: { type: "string", alias: "w", description: "Warmup iterations" },
    vus: { type: "string", description: "Override VU count" },
    "ramp-duration": { type: "string", description: "Ramp duration" },
    "hold-duration": { type: "string", description: "Hold duration" },
    output: { type: "string", alias: "o", description: "Output directory" },
    "skip-warmup": { type: "boolean", description: "Skip warmup" },
    "dry-run": { type: "boolean", description: "Generate report only" },
  },
  async run({ args }) {
    const config = await loadConfig();
    const a = args as Record<string, string | boolean | undefined>;
    const profile = resolveProfile(config, a.profile as string | undefined);

    const pick = (key: string, fallback: string | number): string | number => {
      const cli = a[key];
      if (cli !== undefined && cli !== "") return cli as string;
      const pv = profile?.[key as keyof ProfileConfig];
      return pv !== undefined ? (pv as string | number) : fallback;
    };

    const globalVus = a.vus ? Number(a.vus) : undefined;
    const globalRamp = a["ramp-duration"] as string | undefined;
    const globalHold = a["hold-duration"] as string | undefined;

    const scenarioOverrides = profile?.scenarios
      ? Object.fromEntries(
          Object.entries(profile.scenarios).map(([name, s]) => [
            name,
            {
              ...(s.vus !== undefined && { vus: s.vus }),
              ...(s.rampDuration !== undefined && { rampDuration: s.rampDuration }),
              ...(s.holdDuration !== undefined && { holdDuration: s.holdDuration }),
            },
          ]),
        )
      : undefined;

    const opts: RunOptions = {
      backends: (a.backends as string)?.split(",") ?? Object.keys(config.backends),
      scenarios: (a.scenarios as string)?.split(",") ?? Object.keys(config.scenarios),
      cpus: Number(pick("cpus", config.defaults.cpus)),
      memory: pick("memory", config.defaults.memory) as string,
      repeats: Number(pick("repeats", config.defaults.repeats)),
      warmup: Number(pick("warmup", config.defaults.warmup)),
      vus: globalVus,
      rampDuration: globalRamp,
      holdDuration: globalHold,
      scenarioOverrides,
      profile: a.profile as string | undefined,
      output: (a.output as string) ?? undefined,
      skipWarmup: a["skip-warmup"] === true ? true : (profile?.skipWarmup ?? false),
      dryRun: a["dry-run"] === true,
    };
    await runPipeline(opts);
  },
});
