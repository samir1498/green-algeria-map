import { run } from "../shell";

export async function applyLimits(containerName: string, cpus: number, memory: string): Promise<void> {
  let last: Awaited<ReturnType<typeof run>> | undefined;
  for (let i = 0; i < 3; i++) {
    last = await run("docker", ["update", "--cpus", String(cpus), "--memory", memory, containerName]);
    if (last.exitCode === 0) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Failed to apply limits to ${containerName}: ${last!.stderr || last!.stdout}`);
}
