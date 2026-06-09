import { status } from "./ui/status";

export async function waitForHealth(url: string, label: string, maxWaitSec = 90): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitSec * 1000) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // not ready
    }
    await Bun.sleep(2000);
  }
  throw new Error(`${label} not ready at ${url} after ${maxWaitSec}s`);
}

export async function waitForPortFree(port: number, maxWaitSec = 10): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitSec * 1000) {
    try {
      const server = Bun.listen({ hostname: "0.0.0.0", port, socket: {} });
      server.stop();
      return;
    } catch {
      await Bun.sleep(1000);
    }
  }
  status.setWarning(`Port ${port} may still be in use`);
}
