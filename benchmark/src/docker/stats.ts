import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

export interface StatsCollector {
  stop: () => Promise<void>;
}

export async function startStatsCollection(
  containerName: string,
  outdir: string,
  intervalMs = 5000,
): Promise<StatsCollector> {
  await mkdir(outdir, { recursive: true });
  const outfile = resolve(outdir, `${containerName.replace("green-algeria-", "")}-docker-stats.log`);
  const file = Bun.file(outfile);
  const writer = file.writer();
  let running = true;

  const loop = (async () => {
    while (running) {
      const proc = Bun.spawn(
        ["docker", "stats", "--no-stream", "--format", "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"],
        { stdout: "pipe" },
      );
      const output = await new Response(proc.stdout).text();
      for (const line of output.split("\n")) {
        if (line.includes(containerName)) {
          await writer.write(`${line}\n`);
        }
      }
      await writer.flush();
      await Bun.sleep(intervalMs);
    }
  })();

  return {
    stop: async () => {
      running = false;
      await loop;
      await writer.end();
    },
  };
}
