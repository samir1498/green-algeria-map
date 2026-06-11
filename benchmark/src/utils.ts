import { resolve } from "node:path";
import type { ProfileConfig } from "./types";

export function getRoot(benchRoot?: string): string {
  return resolve(import.meta.dir, benchRoot ?? "../..");
}

export async function retry<T>(fn: () => Promise<T>, options?: { attempts?: number; delay?: number }): Promise<T> {
  const { attempts = 3, delay = 1000 } = options ?? {};
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < attempts - 1) await Bun.sleep(delay);
    }
  }
  throw last;
}

export function resolveProfile(
  config: { profiles?: Record<string, ProfileConfig> },
  profileName?: string,
): ProfileConfig | undefined {
  if (!profileName) return undefined;
  const profile = config.profiles?.[profileName];
  if (!profile)
    throw new Error(`Unknown profile: "${profileName}". Available: ${Object.keys(config.profiles ?? {}).join(", ")}`);
  return profile;
}

export function pick(
  cliArgs: Record<string, string | boolean | undefined>,
  key: string,
  profile: ProfileConfig | undefined,
  fallback: string | number,
): string | number {
  const cli = cliArgs[key];
  if (typeof cli === "string" && cli !== "") return cli;
  const pv = profile?.[key as keyof ProfileConfig];
  return pv !== undefined ? (pv as string | number) : fallback;
}

export function parseDuration(d: string): number {
  const match = d.match(/^(\d+)(s|m)$/);
  if (!match) return 30;
  return Number.parseInt(match[1]) * (match[2] === "m" ? 60 : 1);
}
