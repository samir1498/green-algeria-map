import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { consola } from "consola";
import { step } from "../logger";
import { run } from "../shell";
import type { BackendConfig, ScenarioConfig } from "../types";

const BENCHMARK_DIR = resolve(import.meta.dir, "../..");

export async function runWarmup(backend: string, config: BackendConfig, iterations: number): Promise<void> {
  step(backend, `Warmup (${iterations} iterations)...`);
  // Use auth.js for warmup — override stages via -e STAGES to avoid --iterations/stages conflict
  const result = await run(
    "k6",
    [
      "run",
      "--vus",
      "1",
      "--duration",
      `${iterations}s`,
      "-e",
      `BASE_URL=http://localhost:${config.port}`,
      "-e",
      `API_PREFIX=${config.apiPrefix}`,
      "-e",
      "RAMP_DURATION=0s",
      "-e",
      "HOLD_DURATION=0s",
      "scripts/auth.js",
    ],
    { cwd: BENCHMARK_DIR },
  );
  if (result.exitCode !== 0) {
    throw new Error(`Warmup failed for ${backend}: ${result.stderr || result.stdout || "no output"}`);
  }
  step(backend, "Warmup complete");
}

export async function runScenario(
  backend: string,
  backendConfig: BackendConfig,
  scenario: string,
  scenarioConfig: ScenarioConfig,
  outdir: string,
  runIndex: number,
  vusOverride?: number,
  rampOverride?: string,
  holdOverride?: string,
): Promise<void> {
  await mkdir(outdir, { recursive: true });
  const env = [
    "-e",
    `BASE_URL=http://localhost:${backendConfig.port}`,
    "-e",
    `API_PREFIX=${backendConfig.apiPrefix}`,
    "-e",
    `VUS=${vusOverride ?? scenarioConfig.vus}`,
    "-e",
    `RAMP_DURATION=${rampOverride ?? scenarioConfig.rampDuration}`,
    "-e",
    `HOLD_DURATION=${holdOverride ?? scenarioConfig.holdDuration}`,
  ];
  step(backend, `Running ${scenario} (run ${runIndex})...`);
  const result = await run(
    "k6",
    [
      "run",
      "--out",
      `json=${outdir}/run-${runIndex}.json`,
      "--summary-export",
      `${outdir}/run-${runIndex}-summary.json`,
      ...env,
      `scripts/${scenario}.js`,
    ],
    { cwd: BENCHMARK_DIR, stream: true, suppressStderr: true },
  );
  if (result.exitCode !== 0) {
    throw new Error(
      `[${backend}] ${scenario} run ${runIndex} failed: ${result.stderr || result.stdout || "no output"}`,
    );
  }
}
