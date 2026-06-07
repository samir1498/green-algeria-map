import { run } from "../shell";

export async function applyLimits(containerName: string, cpus: number, memory: string): Promise<void> {
  await run("docker", ["update", "--cpus", String(cpus), "--memory", memory, containerName]);
}
