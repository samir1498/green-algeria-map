import { resolve } from "node:path";
import type { BenchConfig } from "./types";

const CONFIG_PATH = resolve(import.meta.dir, "../bench.config.json");

let cached: BenchConfig | null = null;

export async function loadConfig(): Promise<BenchConfig> {
  if (cached) return cached;
  const file = Bun.file(CONFIG_PATH);
  if (!(await file.exists())) {
    throw new Error(`Config not found: ${CONFIG_PATH}`);
  }
  cached = (await file.json()) as BenchConfig;
  return cached;
}
