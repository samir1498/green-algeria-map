import { resolve } from "node:path";
import { run } from "../shell";
import { status } from "../ui/status";

const ROOT = resolve(import.meta.dir, "../../..");

function failureMessage(result: { exitCode: number; stdout: string; stderr: string }, command: string): string {
  return `${command} failed with exit code ${result.exitCode}: ${result.stderr || result.stdout || "no output"}`;
}

export function getRoot(): string {
  return ROOT;
}

export async function startInfra(): Promise<void> {
  const result = await run("docker", ["compose", "up", "-d", "postgres", "rustfs", "--wait"], { cwd: ROOT });
  if (result.exitCode !== 0) {
    status.setSubtask("Waiting for services (--wait flag failed, polling manually)...");
    const retry = await run("docker", ["compose", "up", "-d", "postgres", "rustfs"], { cwd: ROOT });
    if (retry.exitCode !== 0) {
      throw new Error(failureMessage(retry, "docker compose up -d postgres rustfs"));
    }
  }
}

export async function verifyInfra(): Promise<void> {
  status.setSubtask("Verifying database...");
  let databaseReady = false;
  for (let i = 0; i < 30; i++) {
    const result = await run("docker", ["exec", "green-algeria-db", "pg_isready", "-U", "greenalgeria"]);
    if (result.exitCode === 0) {
      databaseReady = true;
      break;
    }
    if (i % 5 === 0) status.setSubtask(`Waiting for database... (attempt ${i + 1}/30)`);
    await Bun.sleep(2000);
  }
  if (!databaseReady) {
    throw new Error("Postgres was not ready after 30 attempts");
  }

  status.setSubtask("Verifying object storage...");
  let storageReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      await fetch("http://localhost:9000/");
      storageReady = true;
      break;
    } catch {
      if (i % 5 === 0) status.setSubtask(`Waiting for object storage... (attempt ${i + 1}/30)`);
      await Bun.sleep(2000);
    }
  }
  if (!storageReady) {
    throw new Error("RustFS was not ready after 30 attempts");
  }
}

export async function startBackend(profile: string): Promise<void> {
  status.setSubtask(`Starting ${profile}...`);
  const result = await run("docker", ["compose", "--profile", profile, "up", "-d", "--wait"], { cwd: ROOT });
  if (result.exitCode !== 0) {
    const retry = await run("docker", ["compose", "--profile", profile, "up", "-d"], { cwd: ROOT });
    if (retry.exitCode !== 0) {
      throw new Error(failureMessage(retry, `docker compose --profile ${profile} up -d`));
    }
  }
}

export async function stopBackend(profile: string, containerName: string, port: number): Promise<void> {
  status.setSubtask(`Stopping ${profile}...`);
  await run("docker", ["stop", containerName]);
  await run("docker", ["rm", "-f", containerName]);
}

export async function fullCleanup(removeVolumes = false): Promise<void> {
  status.setSubtask("Cleaning up Docker resources...");
  const vol = removeVolumes ? ["-v"] : [];
  await run("docker", ["compose", "down", "--remove-orphans", ...vol], { cwd: ROOT });
  for (const profile of ["nestjs", "springboot", "go"]) {
    await run("docker", ["compose", "--profile", profile, "down", "--remove-orphans", ...vol], { cwd: ROOT });
  }
  const containers = [
    "green-algeria-db",
    "green-algeria-rustfs",
    "green-algeria-nestjs",
    "green-algeria-springboot",
    "green-algeria-go",
    "green-algeria-db-nestjs",
    "green-algeria-db-springboot",
    "green-algeria-db-go",
  ];
  for (const c of containers) {
    await run("docker", ["rm", "-f", c]);
  }
}
