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
import { aggregateResults } from "../report/aggregate";
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
    const so = opts.scenarioOverrides?.[scenario];
    const s = config.scenarios[scenario];
    const ramp = parseDuration(opts.rampDuration ?? so?.rampDuration ?? s.rampDuration);
    const hold = parseDuration(opts.holdDuration ?? so?.holdDuration ?? s.holdDuration);
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
      profile: opts.profile ?? null,
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

async function ensureDatabaseExists(config: BenchConfig, dbName: string): Promise<void> {
  const { database, infrastructure } = config;
  const checkResult = await run("docker", [
    "exec",
    "-i",
    infrastructure.dbContainerName,
    "psql",
    "-U",
    database.username,
    "-d",
    "postgres",
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`,
  ]);
  if (checkResult.exitCode !== 0) {
    throw new Error(`Failed to check database ${dbName}: ${checkResult.stderr || checkResult.stdout || "no output"}`);
  }

  if (checkResult.stdout.trim() === "1") {
    consola.info(`  -> [Postgres] ${dbName} database already exists`);
    return;
  }

  consola.info(`  -> [Postgres] Creating ${dbName} database...`);
  const createResult = await run("docker", [
    "exec",
    "-i",
    infrastructure.dbContainerName,
    "psql",
    "-U",
    database.username,
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `CREATE DATABASE "${dbName}"`,
  ]);
  if (createResult.exitCode !== 0) {
    throw new Error(
      `Failed to create database ${dbName}: ${createResult.stderr || createResult.stdout || "no output"}`,
    );
  }
}

async function runNestjsPreStart(config: BenchConfig): Promise<void> {
  const root = getRoot();
  const nestDir = resolve(root, "backend-nestjs");
  const nestBackend = config.backends.nestjs;
  if (!nestBackend) {
    throw new Error("NestJS backend configuration is missing");
  }
  const dbName = nestBackend.dbName;

  // Check if dist exists; build if missing
  const distExists = await Bun.file(resolve(nestDir, "dist/main.js")).exists();
  if (!distExists) {
    consola.info("  -> [NestJS] dist/ not found, building locally...");
    const buildResult = await run("pnpm", ["build"], { cwd: nestDir, stream: true });
    if (buildResult.exitCode !== 0) {
      throw new Error(`NestJS build failed: ${buildResult.stderr || buildResult.stdout || "no output"}`);
    }
  } else {
    consola.info("  -> [NestJS] dist/ found, skipping build");
  }

  const { database, infrastructure } = config;

  // Create S3 bucket
  consola.info("  -> [NestJS] Creating object storage bucket...");
  const dbEnv = {
    DB_HOST: database.host,
    DB_PORT: String(database.port),
    DB_USERNAME: database.username,
    DB_PASSWORD: database.password,
    DB_NAME: dbName,
    DATABASE_URL: `postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${dbName}`,
  };
  const bucketResult = await run("node", ["scripts/create-bucket.mjs"], {
    cwd: nestDir,
    env: {
      ...dbEnv,
      OO_OBJECT_STORAGE_ENDPOINT: infrastructure.objectStorageEndpoint,
      OO_OBJECT_STORAGE_BUCKET: infrastructure.objectStorageBucket,
      OO_OBJECT_STORAGE_ACCESS_KEY: infrastructure.objectStorageAccessKey,
      OO_OBJECT_STORAGE_SECRET_KEY: infrastructure.objectStorageSecretKey,
    },
    stream: true,
  });
  if (bucketResult.exitCode !== 0) {
    throw new Error(`NestJS bucket creation failed: ${bucketResult.stderr || bucketResult.stdout || "no output"}`);
  }

  // Run migrations locally (TypeScript files available locally, not in Docker image)
  consola.info("  -> [NestJS] Running migrations locally...");
  const migrationResult = await run("npx", ["typeorm-ts-node-commonjs", "migration:run", "-d", "src/data-source.ts"], {
    cwd: nestDir,
    env: dbEnv,
    stream: true,
  });
  if (migrationResult.exitCode !== 0) {
    throw new Error(`NestJS migration failed: ${migrationResult.stderr || migrationResult.stdout || "no output"}`);
  }

  consola.info("  -> [NestJS] Seeding demo data...");
  const seedResult = await run("pnpm", ["seed"], {
    cwd: nestDir,
    env: dbEnv,
    stream: true,
  });
  if (seedResult.exitCode !== 0) {
    throw new Error(`NestJS seed failed: ${seedResult.stderr || seedResult.stdout || "no output"}`);
  }

  consola.success("  NestJS bootstrap completed");
}

async function runGoMigrations(config: BenchConfig): Promise<void> {
  const root = getRoot();
  const migrationFile = resolve(root, "backend-go/migrations/001_init.sql");
  if (!(await Bun.file(migrationFile).exists())) return;
  const sql = await Bun.file(migrationFile).text();
  const upSection = sql.match(/goose Up([\s\S]*?)goose Down/)?.[1]?.trim();
  if (!upSection) return;
  consola.info("  -> [Go] Running migrations...");
  const { database, infrastructure } = config;
  const migrationResult = await run(
    "docker",
    [
      "exec",
      "-i",
      infrastructure.dbContainerName,
      "psql",
      "-U",
      database.username,
      "-d",
      "greenalgeria_go",
      "-c",
      upSection,
    ],
    { stream: true },
  );
  if (migrationResult.exitCode !== 0) {
    throw new Error(`Go migrations failed: ${migrationResult.stderr || migrationResult.stdout || "no output"}`);
  }
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

  const profileLabel = opts.profile ? ` | Profile: ${opts.profile}` : "";
  banner(`BENCHMARK PIPELINE\n  CPUs: ${opts.cpus} | Memory: ${opts.memory} | Repeats: ${opts.repeats}${profileLabel}`);

  process.on("SIGINT", async () => {
    await fullCleanup();
    process.exit(1);
  });
  process.on("SIGTERM", async () => {
    await fullCleanup();
    process.exit(1);
  });

  for (const backendName of opts.backends) {
    if (!config.backends[backendName]) {
      throw new Error(`Unknown backend: "${backendName}". Available: ${Object.keys(config.backends).join(", ")}`);
    }
  }

  const pipelineTimer = timer();

  try {
    await fullCleanup();
    section("Starting shared infrastructure");
    await startInfra();
    const { infrastructure } = config;
    for (const c of [infrastructure.dbContainerName, infrastructure.storageContainerName]) {
      await applyLimits(c, opts.cpus, opts.memory);
    }
    await verifyInfra();

    section("Running migrations");
    consola.info("  -> [Spring Boot] Migrations run on startup");
    for (const backendName of opts.backends) {
      const backend = config.backends[backendName];
      if (backend) {
        await ensureDatabaseExists(config, backend.dbName);
      }
    }
    if (opts.backends.includes("go")) {
      await runGoMigrations(config);
    }
    consola.success("  Databases ready");

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

      consola.box(`Benchmarking: ${backendName}\n  profile: ${backend.profile} | DB: ${backend.dbName}`);

      if (backendName === "nestjs") await runNestjsPreStart(config);

      await startBackend(backend.profile);
      await applyLimits(backend.containerName, opts.cpus, opts.memory);
      await waitForHealth(backend.healthUrl, backendName);

      if (!opts.skipWarmup) await runWarmup(backendName, backend, opts.warmup);

      const stats = await startStatsCollection(backend.containerName, outdir);

      for (const scenario of opts.scenarios) {
        const scenarioConfig = config.scenarios[scenario];
        if (!scenarioConfig) {
          throw new Error(`Unknown scenario: ${scenario}. Available: ${Object.keys(config.scenarios).join(", ")}`);
        }
        const scenarioOutdir = resolve(outdir, backendName, scenario);
        const so = opts.scenarioOverrides?.[scenario];
        for (let i = 1; i <= opts.repeats; i++) {
          await runScenario(
            backendName,
            backend,
            scenario,
            scenarioConfig,
            scenarioOutdir,
            i,
            opts.vus ?? so?.vus,
            opts.rampDuration ?? so?.rampDuration,
            opts.holdDuration ?? so?.holdDuration,
          );
        }
      }

      await stats.stop();
      step(backendName, "Generating summary...");
      await aggregateResults(backendName, resolve(outdir, backendName), opts.scenarios, opts.repeats);
      await stopBackend(backend.profile, backend.containerName, backend.port);
      await waitForPortFree(backend.port);
    }

    await fullCleanup();
    const elapsed = pipelineTimer.stop();
    consola.box(
      `PIPELINE COMPLETE\n\n  Results: ${outdir}\n  Duration: ${formatDuration(elapsed)}\n\n  Compare: bun run bench compare ${outdir}`,
    );
  } catch (err) {
    consola.error("Pipeline failed:", err);
    await fullCleanup();
    process.exit(1);
  }
}
