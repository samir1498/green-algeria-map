import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import pkg from "../../package.json";
import { fullCleanup, getRoot, startBackend, startInfra, stopBackend, verifyInfra } from "../docker/compose";
import { applyLimits } from "../docker/limits";
import { startStatsCollection } from "../docker/stats";
import { waitForHealth, waitForPortFree } from "../health";
import { runScenario, runWarmup } from "../k6/runner";
import { loadConfig } from "../loader";
import { formatDuration, timer } from "../logger";
import { aggregateResults } from "../report/aggregate";
import { run } from "../shell";
import type { BenchConfig, RunOptions } from "../types";
import { status } from "../ui/status";
import { parseDuration } from "../utils";

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
    cliVersion: pkg.version,
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
  const result = await run("docker", [
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
  if (result.exitCode !== 0) {
    throw new Error(`Failed to check database ${dbName}: ${result.stderr || result.stdout || "no output"}`);
  }
  if (result.stdout.trim() === "1") return;
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
  if (!nestBackend) throw new Error("NestJS backend configuration is missing");
  const dbName = nestBackend.dbName;
  const { database, infrastructure } = config;

  const distExists = await Bun.file(resolve(nestDir, "dist/main.js")).exists();
  if (!distExists) {
    status.setSubtask("Building NestJS dist/...");
    const buildResult = await run("pnpm", ["build"], { cwd: nestDir });
    if (buildResult.exitCode !== 0) {
      throw new Error(`NestJS build failed: ${buildResult.stderr || buildResult.stdout || "no output"}`);
    }
  }

  status.setSubtask("Creating object storage bucket...");
  await createBucket(config);

  status.setSubtask("Running TypeORM migrations...");
  const dbEnv = {
    DB_HOST: database.host,
    DB_PORT: String(database.port),
    DB_USERNAME: database.username,
    DB_PASSWORD: database.password,
    DB_NAME: dbName,
    DATABASE_URL: `postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${dbName}`,
  };
  const migrationResult = await run("npx", ["typeorm-ts-node-commonjs", "migration:run", "-d", "src/data-source.ts"], {
    cwd: nestDir,
    env: dbEnv,
  });
  if (migrationResult.exitCode !== 0) {
    throw new Error(`NestJS migration failed: ${migrationResult.stderr || migrationResult.stdout || "no output"}`);
  }

  status.setSubtask("Seeding demo data...");
  const seedResult = await run("pnpm", ["seed"], { cwd: nestDir, env: dbEnv });
  if (seedResult.exitCode !== 0) {
    throw new Error(`NestJS seed failed: ${seedResult.stderr || seedResult.stdout || "no output"}`);
  }
}

async function runSpringbootPreStart(config: BenchConfig): Promise<void> {
  const root = getRoot();
  const sb = config.backends.springboot;
  if (!sb) throw new Error("Spring Boot backend config missing");
  const dbName = sb.dbName;
  const { database } = config;

  status.setSubtask("Running Flyway migrations...");
  const dbEnv = {
    SPRING_DATASOURCE_URL: `jdbc:postgresql://${database.host}:${database.port}/${dbName}`,
    SPRING_DATASOURCE_USERNAME: database.username,
    SPRING_DATASOURCE_PASSWORD: database.password,
  };
  const result = await run("./mvnw", ["flyway:migrate"], {
    cwd: resolve(root, "backend-springboot"),
    env: dbEnv,
  });
  if (result.exitCode !== 0) {
    throw new Error(`Flyway migration failed: ${result.stderr || result.stdout || "no output"}`);
  }
  status.setDone("Flyway migrations complete");
}

async function runGoMigrations(config: BenchConfig): Promise<void> {
  const root = getRoot();
  const migrationFile = resolve(root, "backend-go/migrations/001_init.sql");
  if (!(await Bun.file(migrationFile).exists())) return;
  const sql = await Bun.file(migrationFile).text();
  const upSection = sql.match(/\+goose Up([\s\S]*?)\+goose Down/)?.[1]?.trim();
  if (!upSection) {
    status.setWarning("No Go migration section found (non-fatal)");
    return;
  }
  status.setSubtask("Running Go migrations...");
  const { database, infrastructure } = config;
  const result = await run("docker", [
    "exec",
    "-i",
    infrastructure.dbContainerName,
    "psql",
    "-U",
    database.username,
    "-d",
    config.backends.go.dbName,
    "-c",
    upSection,
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`Go migrations failed: ${result.stderr || result.stdout || "no output"}`);
  }
}

async function createBucket(config: BenchConfig): Promise<void> {
  const root = getRoot();
  const { infrastructure } = config;
  const bucketEnv = {
    OO_OBJECT_STORAGE_ENDPOINT: infrastructure.objectStorageEndpoint,
    OO_OBJECT_STORAGE_BUCKET: infrastructure.objectStorageBucket,
    OO_OBJECT_STORAGE_ACCESS_KEY: infrastructure.objectStorageAccessKey,
    OO_OBJECT_STORAGE_SECRET_KEY: infrastructure.objectStorageSecretKey,
    OO_OBJECT_STORAGE_REGION: infrastructure.objectStorageRegion,
  };
  const bucketResult = await run("node", [resolve(root, "backend-nestjs/scripts/create-bucket.mjs")], {
    env: bucketEnv,
  });
  if (bucketResult.exitCode !== 0) {
    throw new Error(`S3 bucket creation failed: ${bucketResult.stderr || bucketResult.stdout}`);
  }
}

function setBenchEnv(backendName: string, opts: RunOptions, config: BenchConfig): void {
  const backend = config.backends[backendName];
  const heapRatio = backend?.heapRatio ?? config.defaults.heapRatio ?? 0.5;
  if (backendName === "nestjs") {
    const heapMb = Math.round(Number.parseInt(opts.memory) * heapRatio);
    process.env.NODE_OPTIONS = `--max-old-space-size=${heapMb}`;
    process.env.DISABLE_SWAGGER = "true";
  }
  if (backendName === "springboot") {
    const heapMb = Math.round(Number.parseInt(opts.memory) * heapRatio);
    process.env.JAVA_TOOL_OPTIONS = `-Xmx${heapMb}m -Xlog:gc*:file=/tmp/gc.log:time,level,tags`;
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
    status.setDone(`Dry-run report saved to ${reportPath}`);
    status.finish(`Dry-run report:\n  ${reportPath}`);
    return;
  }

  for (const backendName of opts.backends) {
    if (!config.backends[backendName]) {
      throw new Error(`Unknown backend: "${backendName}". Available: ${Object.keys(config.backends).join(", ")}`);
    }
  }

  const pipelineTimer = timer();

  try {
    status.setPhase("Starting shared infrastructure...");
    await fullCleanup();
    await startInfra();
    const { infrastructure } = config;
    for (const c of [infrastructure.dbContainerName, infrastructure.storageContainerName]) {
      await applyLimits(c, opts.cpus, opts.memory);
    }
    await verifyInfra();
    status.setDone("Infrastructure verified");

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

    const onSignal = async () => {
      status.stop();
      await fullCleanup(true);
      process.exit(1);
    };
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);

    for (const backendName of opts.backends) {
      const backend = config.backends[backendName];

      // Per-backend: reset infra for clean state
      status.setPhase(`Benchmarking ${backendName}...`);
      status.setSubtask("Resetting shared infrastructure...");
      await fullCleanup(true);
      await startInfra();
      await verifyInfra();

      // Ensure per-backend database exists
      status.setSubtask("Setting up database...");
      await ensureDatabaseExists(config, backend.dbName);

      // Recreate S3 bucket (fullCleanup wipes RustFS volume)
      status.setSubtask("Creating S3 bucket...");
      await createBucket(config);

      // Pre-start: migrations and seeding
      if (backendName === "nestjs") await runNestjsPreStart(config);
      if (backendName === "go") await runGoMigrations(config);
      if (backendName === "springboot") await runSpringbootPreStart(config);

      // Start backend
      setBenchEnv(backendName, opts, config);
      await startBackend(backend.profile);
      await applyLimits(backend.containerName, opts.cpus, opts.memory);

      // Restart Spring Boot so JVM re-reads cgroup memory limit
      if (backendName === "springboot") {
        await run("docker", ["restart", backend.containerName]);
      }

      // Health check + startup time
      const startTimer = timer();
      await waitForHealth(backend.healthUrl, backendName);
      const startupMs = startTimer.stop();
      await Bun.write(resolve(outdir, `${backendName}-startup.log`), `${startupMs}\n`);
      status.setDone(`${backendName} ready (${Math.round(startupMs / 1000)}s startup)`);

      // Warmup
      if (!opts.skipWarmup) {
        status.setSubtask("Running warmup...");
        await runWarmup(backendName, backend, opts.warmup);
      }

      // Docker stats collection
      const stats = await startStatsCollection(backend.containerName, outdir);

      // Run scenarios
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
            opts.repeats,
          );
          // Capture container logs BEFORE health check (server might be dead)
          if (backendName === "springboot") {
            const logsResult = await run("docker", ["logs", backend.containerName], { suppressStderr: true });
            await Bun.write(resolve(scenarioOutdir, "springboot-container.log"), logsResult.stdout);
            if (logsResult.stderr) {
              await Bun.write(resolve(scenarioOutdir, "springboot-container-err.log"), logsResult.stderr);
            }
          }
          // Quick health check — abort if server OOM'd mid-run
          let alive = false;
          for (let h = 0; h < 3 && !alive; h++) {
            alive = await fetch(backend.healthUrl)
              .then((r) => r.ok)
              .catch(() => false);
            if (!alive) await Bun.sleep(2000);
          }
          if (!alive) throw new Error(`[${backendName}] Backend down after ${scenario} (run ${i})`);
        }
      }

      await stats.stop();

      // Post-run collection
      if (backendName === "springboot") {
        status.setSubtask("Collecting GC logs...");
        const gcResult = await run("docker", [
          "cp",
          `${backend.containerName}:/tmp/gc.log`,
          resolve(outdir, "springboot-gc.log"),
        ]);
        if (gcResult.exitCode !== 0) {
          status.setWarning("GC log not available (non-fatal)");
        }
        try {
          const baseUrl = `http://localhost:${backend.port}`;
          const jvmMetrics = ["jvm.memory.used", "jvm.memory.max", "jvm.gc.pause"];
          const jvmData: Record<string, unknown> = {};
          for (const metric of jvmMetrics) {
            const resp = await fetch(`${baseUrl}/metrics/${metric}`);
            if (resp.ok) jvmData[metric] = await resp.json();
          }
          if (Object.keys(jvmData).length > 0) {
            await Bun.write(resolve(outdir, "springboot-jvm-metrics.json"), JSON.stringify(jvmData, null, 2));
          }
        } catch {
          status.setWarning("JVM metrics not available (non-fatal)");
        }
      }

      status.setSubtask("Aggregating results...");
      await aggregateResults(backendName, resolve(outdir, backendName), opts.scenarios, opts.repeats);
      await stopBackend(backend.profile, backend.containerName);
      await waitForPortFree(backend.port);
    }

    status.setPhase("Final cleanup...");
    await fullCleanup(true);
    const elapsed = pipelineTimer.stop();
    status.finish(
      `PIPELINE COMPLETE\n\nResults: ${outdir}\nDuration: ${formatDuration(elapsed)}\n\nCompare: bun run bench compare ${outdir}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    status.setError(msg);
    await fullCleanup(true);
    process.exit(1);
  }
}
