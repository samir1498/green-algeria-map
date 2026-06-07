import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { consola } from "consola";
import { fullCleanup, getRoot, startBackend, startInfra, stopBackend, verifyInfra } from "../docker/compose";
import { applyLimits } from "../docker/limits";
import { startStatsCollection } from "../docker/stats";
import { waitForHealth, waitForPortFree } from "../health";
import { runScenario, runWarmup } from "../k6/runner";
import { loadConfig } from "../loader";
import { banner, formatDuration, section, step, timer } from "../logger";
import { aggregateResults } from "../results/aggregate";
import { run } from "../shell";
import type { BenchConfig, RunOptions } from "../types";

function parseDuration(d: string): number {
  const match = d.match(/^(\d+)(s|m)$/);
  if (!match) return 30;
  return Number.parseInt(match[1]) * (match[2] === "m" ? 60 : 1);
}

function estimateDuration(opts: RunOptions, config: BenchConfig): string {
  let totalMinutes = 0;
  for (const scenario of opts.scenarios) {
    const s = config.scenarios[scenario];
    const ramp = parseDuration(opts.rampDuration ?? s.rampDuration);
    const hold = parseDuration(opts.holdDuration ?? s.holdDuration);
    const perRun = ramp * 2 + hold;
    totalMinutes += (perRun / 60) * opts.repeats;
  }
  if (!opts.skipWarmup) totalMinutes += 2;
  totalMinutes *= opts.backends.length;
  totalMinutes += 5;
  return `~${Math.round(totalMinutes)}m`;
}

export async function generateDryRunReport(config: BenchConfig, opts: RunOptions, outdir: string): Promise<string> {
  await mkdir(outdir, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    cliVersion: "0.1.0",
    config: {
      backends: opts.backends,
      scenarios: opts.scenarios,
      cpus: opts.cpus,
      memory: opts.memory,
      repeats: opts.repeats,
      warmupIterations: opts.warmup,
      skipWarmup: opts.skipWarmup,
    },
    backends: Object.fromEntries(
      opts.backends.map((name) => {
        const b = config.backends[name];
        return [name, { port: b.port, apiPrefix: b.apiPrefix, healthUrl: b.healthUrl, dbName: b.dbName }];
      }),
    ),
    scenarios: Object.fromEntries(
      opts.scenarios.map((name) => {
        const s = config.scenarios[name];
        return [
          name,
          {
            vus: opts.vus ?? s.vus,
            rampDuration: opts.rampDuration ?? s.rampDuration,
            holdDuration: opts.holdDuration ?? s.holdDuration,
          },
        ];
      }),
    ),
    executionPlan: [
      "1. Start shared infra (postgres + rustfs)",
      "2. Run migrations (Go SQL, NestJS TypeORM)",
      `3. For each backend: start -> warmup(${opts.skipWarmup ? "skipped" : opts.warmup}) -> run scenarios(${opts.repeats}x) -> stop`,
      "4. Aggregate results (median across runs)",
      "5. Cleanup",
    ],
    estimatedTotalDuration: estimateDuration(opts, config),
  };
  const outPath = resolve(outdir, "dry-run.json");
  await Bun.write(outPath, JSON.stringify(report, null, 2));
  return outPath;
}

async function runNestjsPreStart(): Promise<void> {
  const root = getRoot();
  const nestDir = resolve(root, "backend-nestjs");
  const distExists = await Bun.file(resolve(nestDir, "dist/main.js")).exists();
  if (!distExists) {
    consola.info("  -> [NestJS] dist/ not found, building...");
    const buildResult = await run("pnpm", ["build"], { cwd: nestDir, stream: true });
    if (buildResult.exitCode !== 0) throw new Error("NestJS build failed");
  }
  consola.info("  -> [NestJS] Running migrations + seed...");
  const dbEnv = {
    DB_HOST: "localhost",
    DB_PORT: "5432",
    DB_USERNAME: "greenalgeria",
    DB_PASSWORD: "greenalgeria",
    DB_NAME: "greenalgeria_nestjs",
    DATABASE_URL: "postgresql://greenalgeria:greenalgeria@localhost:5432/greenalgeria_nestjs",
  };
  await run("node", ["scripts/create-bucket.mjs"], {
    cwd: nestDir,
    env: {
      ...dbEnv,
      OO_OBJECT_STORAGE_ENDPOINT: "http://localhost:9000",
      OO_OBJECT_STORAGE_BUCKET: "green-algeria",
      OO_OBJECT_STORAGE_ACCESS_KEY: "greenalgeria-access",
      OO_OBJECT_STORAGE_SECRET_KEY: "greenalgeria-secret-change-me",
    },
  });
  await run("pnpm", ["migration:run"], { cwd: nestDir, env: dbEnv, stream: true });
  await run("pnpm", ["seed"], { cwd: nestDir, env: dbEnv });
}

async function runGoMigrations(): Promise<void> {
  const root = getRoot();
  const migrationFile = resolve(root, "backend-go/migrations/001_init.sql");
  if (!(await Bun.file(migrationFile).exists())) return;
  const sql = await Bun.file(migrationFile).text();
  const upSection = sql.match(/goose Up([\s\S]*?)goose Down/)?.[1]?.trim();
  if (!upSection) return;
  consola.info("  -> [Go] Running migrations...");
  await run("docker", [
    "exec",
    "-i",
    "green-algeria-db",
    "psql",
    "-U",
    "greenalgeria",
    "-d",
    "greenalgeria_go",
    "-c",
    upSection,
  ]);
}

export async function runPipeline(opts: RunOptions): Promise<void> {
  const config = await loadConfig();
  const root = getRoot();
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
  const outdir = opts.output ?? resolve(root, `results/${timestamp}-pipeline-${opts.cpus}cpu`);
  await mkdir(outdir, { recursive: true });

  if (opts.dryRun) {
    const reportPath = await generateDryRunReport(config, opts, outdir);
    consola.box(`Dry-run report saved to:\n  ${reportPath}\n\nReview and commit, then run without --dry-run.`);
    return;
  }

  banner(`BENCHMARK PIPELINE\n  CPUs: ${opts.cpus} | Memory: ${opts.memory} | Repeats: ${opts.repeats}`);

  process.on("SIGINT", async () => {
    await fullCleanup();
    process.exit(1);
  });
  process.on("SIGTERM", async () => {
    await fullCleanup();
    process.exit(1);
  });

  const pipelineTimer = timer();

  try {
    await fullCleanup();
    section("Starting shared infrastructure");
    await startInfra();
    for (const c of ["green-algeria-db", "green-algeria-rustfs"]) {
      await applyLimits(c, opts.cpus, opts.memory);
    }
    await verifyInfra();

    section("Running migrations");
    consola.info("  -> [Spring Boot] Migrations run on startup");
    await runGoMigrations();
    consola.info("  -> [NestJS] Ensuring database exists...");
    await run("docker", [
      "exec",
      "-i",
      "green-algeria-db",
      "psql",
      "-U",
      "greenalgeria",
      "-c",
      "CREATE DATABASE greenalgeria_nestjs",
    ]);

    await Bun.write(
      resolve(outdir, "config.json"),
      JSON.stringify(
        {
          backends: opts.backends,
          scenarios: opts.scenarios,
          cpus: opts.cpus,
          memory: opts.memory,
          repeats: opts.repeats,
          warmup: opts.warmup,
        },
        null,
        2,
      ),
    );

    section("Running benchmarks sequentially");

    for (const backendName of opts.backends) {
      const backend = config.backends[backendName];
      if (!backend) {
        consola.error(`Unknown backend: ${backendName}`);
        continue;
      }

      consola.box(`Benchmarking: ${backendName}\n  profile: ${backend.profile} | DB: ${backend.dbName}`);

      if (backendName === "nestjs") await runNestjsPreStart();

      await startBackend(backend.profile);
      await applyLimits(backend.containerName, opts.cpus, opts.memory);
      await waitForHealth(backend.healthUrl, backendName);

      if (!opts.skipWarmup) await runWarmup(backendName, backend, opts.warmup);

      const stats = await startStatsCollection(backend.containerName, outdir);

      for (const scenario of opts.scenarios) {
        const scenarioConfig = config.scenarios[scenario];
        if (!scenarioConfig) {
          consola.warn(`Unknown scenario: ${scenario}`);
          continue;
        }
        const scenarioOutdir = resolve(outdir, backendName, scenario);
        for (let i = 1; i <= opts.repeats; i++) {
          await runScenario(
            backendName,
            backend,
            scenario,
            scenarioConfig,
            scenarioOutdir,
            i,
            opts.vus,
            opts.rampDuration,
            opts.holdDuration,
          );
        }
      }

      stats.stop();
      step(backendName, "Generating summary...");
      await aggregateResults(backendName, resolve(outdir, backendName), opts.scenarios);
      await stopBackend(backend.profile, backend.containerName, backend.port);
      await waitForPortFree(backend.port);
    }

    await fullCleanup();
    const elapsed = pipelineTimer.stop();
    consola.box(
      `PIPELINE COMPLETE\n\n  Results: ${outdir}\n  Duration: ${formatDuration(elapsed)}\n\n  Compare: bun run src/index.ts compare ${outdir}`,
    );
  } catch (err) {
    consola.error("Pipeline failed:", err);
    await fullCleanup();
    process.exit(1);
  }
}
