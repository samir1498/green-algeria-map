import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineCommand } from "citty";
import { consola } from "consola";
import { waitForHealth } from "../health";
import { runScenario, runWarmup } from "../k6/runner";
import { loadConfig } from "../loader";
import { banner, formatDuration, timer } from "../logger";
import type { ProfileConfig } from "../types";

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

export const singleCommand = defineCommand({
  meta: { name: "single", description: "Benchmark a single backend (infra must be running)" },
  args: {
    backend: { type: "positional", required: true, description: "Backend name" },
    scenarios: { type: "string", alias: "s", description: "Comma-separated scenarios" },
    profile: { type: "string", alias: "P", description: "Config profile (e.g. 'full')" },
    repeats: { type: "string", alias: "r", description: "Runs per scenario" },
    warmup: { type: "string", alias: "w", description: "Warmup iterations" },
    vus: { type: "string", description: "Override VU count" },
    "ramp-duration": { type: "string", description: "Ramp duration" },
    "hold-duration": { type: "string", description: "Hold duration" },
    output: { type: "string", alias: "o", description: "Output directory" },
    "skip-warmup": { type: "boolean", description: "Skip warmup" },
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

    const backendName = a.backend as string;
    const backend = config.backends[backendName];
    if (!backend) throw new Error(`Unknown backend: ${backendName}`);

    const scenarios = (a.scenarios as string)?.split(",") ?? Object.keys(config.scenarios);
    const repeats = Number(pick("repeats", config.defaults.repeats));
    const warmup = Number(pick("warmup", config.defaults.warmup));
    const outdir = (a.output as string) ?? resolve(import.meta.dir, `../../results/${Date.now()}-${backendName}`);
    await mkdir(outdir, { recursive: true });

    const profileLabel = a.profile ? ` | Profile: ${a.profile}` : "";
    banner(
      `Benchmark: ${backendName}\n  Port: ${backend.port} | Scenarios: ${scenarios.join(", ")} | Repeats: ${repeats}${profileLabel}`,
    );

    const t = timer();
    await waitForHealth(backend.healthUrl, backendName);

    const skipWarmup = a["skip-warmup"] === true ? true : (profile?.skipWarmup ?? false);
    if (!skipWarmup) await runWarmup(backendName, backend, warmup);

    const globalVus = a.vus ? Number(a.vus) : undefined;
    const globalRamp = a["ramp-duration"] as string | undefined;
    const globalHold = a["hold-duration"] as string | undefined;

    for (const scenario of scenarios) {
      const scenarioConfig = config.scenarios[scenario];
      if (!scenarioConfig) {
        throw new Error(`Unknown scenario: ${scenario}. Available: ${Object.keys(config.scenarios).join(", ")}`);
      }
      const so = profile?.scenarios?.[scenario];
      const scenarioOutdir = resolve(outdir, scenario);
      for (let i = 1; i <= repeats; i++) {
        await runScenario(
          backendName,
          backend,
          scenario,
          scenarioConfig,
          scenarioOutdir,
          i,
          globalVus ?? so?.vus,
          globalRamp ?? so?.rampDuration,
          globalHold ?? so?.holdDuration,
        );
      }
    }

    consola.box(`Done in ${formatDuration(t.stop())}\n  Results: ${outdir}`);
  },
});
