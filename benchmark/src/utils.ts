import type { ProfileConfig } from "./types";

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
  if (cli !== undefined && cli !== "") return cli as string;
  const pv = profile?.[key as keyof ProfileConfig];
  return pv !== undefined ? (pv as string | number) : fallback;
}

export function parseDuration(d: string): number {
  const match = d.match(/^(\d+)(s|m)$/);
  if (!match) return 30;
  return Number.parseInt(match[1]) * (match[2] === "m" ? 60 : 1);
}

export async function retry<T>(
  fn: () => Promise<T>,
  isSuccess: (result: T) => boolean,
  maxAttempts: number,
  delayMs: number,
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await fn();
    if (isSuccess(result)) return result;
    if (i < maxAttempts - 1) await Bun.sleep(delayMs);
  }
  return fn();
}
