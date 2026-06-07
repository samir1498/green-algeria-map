import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startStatsCollection } from "../docker/stats";

describe("startStatsCollection", () => {
  it("waits for the loop to stop before closing the file", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "benchmark-stats-"));
    const outdir = join(tempDir, "out");
    const originalSpawn = Bun.spawn;
    const encoder = new TextEncoder();
    let spawnCalls = 0;
    Bun.spawn = ((_command, _options) => {
      spawnCalls += 1;
      return {
        stdout: new ReadableStream<Uint8Array>({
          start(controller) {
            setTimeout(() => {
              controller.enqueue(encoder.encode("green-algeria-nestjs\t12%\t100MiB / 1GiB\t10%\n"));
              controller.close();
            }, 25);
          },
        }),
      };
    }) as typeof Bun.spawn;

    try {
      const collector = await startStatsCollection("green-algeria-nestjs", outdir, 1);
      await collector.stop();

      const log = await readFile(join(outdir, "nestjs-docker-stats.log"), "utf8");
      expect(spawnCalls).toBeGreaterThan(0);
      expect(log).toContain("green-algeria-nestjs");
    } finally {
      Bun.spawn = originalSpawn;
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
