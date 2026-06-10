import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { readStream, run } from "../shell";
import type { BackendConfig, ScenarioConfig } from "../types";
import type { LiveMetrics } from "../ui/status";
import { status } from "../ui/status";

const BENCHMARK_DIR = resolve(import.meta.dir, "../..");

export async function runWarmup(backend: string, config: BackendConfig, iterations: number): Promise<void> {
  status.setSubtask(`[${backend}] Warmup (${iterations} iterations)...`);
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
  status.setSubtask(`[${backend}] Warmup complete`);
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
  totalRuns?: number,
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

  await runWithLiveOutput(backend, scenario, outdir, runIndex, totalRuns ?? 1, env);
}

async function parseJsonStream(
  stream: ReadableStream<Uint8Array>,
  state: LiveMetrics,
  startedAt: { value: number },
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type !== "Point") continue;
        const metric = event.metric;
        const val = event.data?.value ?? 0;

        if (startedAt.value === 0) {
          startedAt.value = Date.now();
        }

        if (metric === "http_reqs") {
          state.requests += val;
        } else if (metric === "http_req_failed") {
          state.failures += val;
        } else if (metric === "http_req_duration") {
          state.totalDuration += val;
          state.durationCount += 1;
        } else if (metric === "vus") {
          state.currentVUs = Math.round(val);
        }
      } catch {}
    }
  }
}

async function runWithLiveOutput(
  backend: string,
  scenario: string,
  outdir: string,
  runIndex: number,
  totalRuns: number,
  env: string[],
): Promise<void> {
  status.setPhase(`Running ${scenario} (${runIndex}/${totalRuns})`);

  const proc = Bun.spawn({
    cmd: [
      "k6",
      "run",
      "--quiet",
      "--no-thresholds",
      "--out",
      `json=${outdir}/run-${runIndex}.json`,
      "--out",
      "json=-",
      "--summary-export",
      `${outdir}/run-${runIndex}-summary.json`,
      ...env,
      `scripts/${scenario}.js`,
    ],
    cwd: BENCHMARK_DIR,
    stdout: "pipe",
    stderr: "pipe",
  });

  const state: LiveMetrics = {
    requests: 0,
    failures: 0,
    totalDuration: 0,
    durationCount: 0,
    currentVUs: 0,
    elapsedSec: 0,
  };

  const startedAt: { value: number } = { value: 0 };

  const updateTimer = setInterval(() => {
    if (startedAt.value > 0) {
      state.elapsedSec = (Date.now() - startedAt.value) / 1000;
      status.setMetrics(backend, scenario, runIndex, totalRuns, state);
    }
  }, 200);

  const [exitCode] = await Promise.all([
    proc.exited,
    proc.stdout ? parseJsonStream(proc.stdout, state, startedAt) : Promise.resolve(),
    proc.stderr ? readStream(proc.stderr) : Promise.resolve(""),
  ]);

  clearInterval(updateTimer);

  state.elapsedSec = startedAt.value > 0 ? (Date.now() - startedAt.value) / 1000 : 0;

  if (exitCode !== 0 && exitCode !== 99) {
    status.setError(`[${backend}] ${scenario} run ${runIndex} failed (exit ${exitCode})`);
    throw new Error(`[${backend}] ${scenario} run ${runIndex} failed (exit ${exitCode})`);
  }

  status.setDone(`${scenario} (${runIndex}/${totalRuns}) complete`);
}
