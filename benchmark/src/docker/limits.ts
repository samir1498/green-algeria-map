import { cpus } from "node:os";
import { run } from "../shell";

function cpusetArg(requested: number): string {
  const hostCores = cpus().length;
  const count = Math.min(requested, hostCores);
  return Array.from({ length: count }, (_, i) => i).join(",");
}

export async function applyLimits(containerName: string, cpus: number, memory: string): Promise<void> {
  const cpuset = cpusetArg(cpus);
  let last: Awaited<ReturnType<typeof run>> | undefined;
  for (let i = 0; i < 3; i++) {
    last = await run("docker", [
      "update",
      "--cpuset-cpus",
      cpuset,
      "--cpus",
      String(cpus),
      "--memory",
      memory,
      "--memory-swap",
      memory,
      containerName,
    ]);
    if (last.exitCode === 0) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.warn(`[warn] Failed to apply CPU/memory limits to ${containerName}: ${last!.stderr || last!.stdout}`);
}
