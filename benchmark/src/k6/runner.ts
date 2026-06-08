import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { step } from "../logger";
import { run } from "../shell";
import type { BackendConfig, ScenarioConfig } from "../types";
import { type LiveMetrics, createProgressDisplay } from "../ui/progress";

const BENCHMARK_DIR = resolve(import.meta.dir, "../..");

export async function runWarmup(backend: string, config: BackendConfig, iterations: number): Promise<void> {
  step(backend, `Warmup (${iterations} iterations)...`);
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

  if (totalRuns && totalRuns > 0) {
    await runWithLiveOutput(backend, scenario, outdir, runIndex, totalRuns, env);
  } else {
    await runQuiet(backend, scenario, outdir, runIndex, env);
  }
}

async function runQuiet(
  backend: string,
  scenario: string,
  outdir: string,
  runIndex: number,
  env: string[],
): Promise<void> {
  step(backend, `Running ${scenario} (run ${runIndex})...`);
  const proc = Bun.spawn({
    cmd: [
      "k6",
      "run",
      "--no-thresholds",
      "--out",
      `json=${outdir}/run-${runIndex}.json`,
      "--summary-export",
      `${outdir}/run-${runIndex}-summary.json`,
      ...env,
      `scripts/${scenario}.js`,
    ],
    cwd: BENCHMARK_DIR,
    stdout: "inherit",
    stderr: "pipe",
  });
  const stderrReader = proc.stderr?.getReader();
  const decoder = new TextDecoder();
  let stderr = "";
  if (stderrReader) {
    while (true) {
      const { value, done } = await stderrReader.read();
      if (done) break;
      stderr += decoder.decode(value, { stream: true });
    }
    stderr += decoder.decode();
  }
  const exitCode = await proc.exited;
  if (exitCode !== 0 && exitCode !== 99) {
    throw new Error(`[${backend}] ${scenario} run ${runIndex} failed: ${stderr.trim() || "no output"}`);
  }
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode();
  return result;
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
  const display = createProgressDisplay(backend, scenario, runIndex, totalRuns);

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

  const renderTimer = setInterval(() => {
    if (startedAt.value > 0) {
      state.elapsedSec = (Date.now() - startedAt.value) / 1000;
      display.update(state);
    }
  }, 200);

  const [exitCode] = await Promise.all([
    proc.exited,
    proc.stdout ? parseJsonStream(proc.stdout, state, startedAt) : Promise.resolve(),
    proc.stderr ? readStream(proc.stderr) : Promise.resolve(""),
  ]);

  clearInterval(renderTimer);

  state.elapsedSec = startedAt.value > 0 ? (Date.now() - startedAt.value) / 1000 : 0;

  if (exitCode !== 0 && exitCode !== 99) {
    display.fail(`exit code ${exitCode}`);
    throw new Error(`[${backend}] ${scenario} run ${runIndex} failed (exit ${exitCode})`);
  }

  display.done(state, exitCode);
}
