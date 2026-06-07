import { resolve } from "node:path";
import { consola } from "consola";
import { run } from "../shell";

const ROOT = resolve(import.meta.dir, "../../../..");

export function getRoot(): string {
  return ROOT;
}

export async function startInfra(): Promise<void> {
  consola.info("Starting shared infrastructure (postgres + rustfs)...");
  const result = await run("docker", ["compose", "up", "-d", "postgres", "rustfs", "--wait"], { cwd: ROOT });
  if (result.exitCode !== 0) {
    await run("docker", ["compose", "up", "-d", "postgres", "rustfs"], { cwd: ROOT });
  }
}

export async function verifyInfra(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const result = await run("docker", ["exec", "green-algeria-db", "pg_isready", "-U", "greenalgeria"]);
    if (result.exitCode === 0) break;
    await Bun.sleep(2000);
  }
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch("http://localhost:9000/");
      if (res.ok) break;
    } catch {
      await Bun.sleep(2000);
    }
  }
  consola.success("Infrastructure verified");
}

export async function startBackend(profile: string): Promise<void> {
  consola.info(`Starting ${profile}...`);
  const result = await run("docker", ["compose", "--profile", profile, "up", "-d", "--wait"], { cwd: ROOT });
  if (result.exitCode !== 0) {
    await run("docker", ["compose", "--profile", profile, "up", "-d"], { cwd: ROOT });
  }
}

export async function stopBackend(profile: string, containerName: string, port: number): Promise<void> {
  consola.info(`Stopping ${profile} (port ${port})...`);
  await run("docker", ["compose", "--profile", profile, "down", "-v"], { cwd: ROOT });
  await run("docker", ["rm", "-f", containerName]);
}

export async function fullCleanup(): Promise<void> {
  consola.info("Cleanup...");
  await run("docker", ["compose", "down", "--remove-orphans", "-v"], { cwd: ROOT });
  for (const profile of ["nestjs", "springboot", "go"]) {
    await run("docker", ["compose", "--profile", profile, "down", "--remove-orphans", "-v"], { cwd: ROOT });
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
  consola.success("Cleanup complete");
}
