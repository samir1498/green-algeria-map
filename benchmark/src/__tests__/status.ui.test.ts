import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { StatusBar } from "../ui/status";

const CURSOR_HIDE = "\u001b[?25l";
const CURSOR_SHOW = "\u001b[?25h";

const stderrWrites: string[] = [];
const stdoutWrites: string[] = [];
let origStderrWrite: typeof process.stderr.write;
let origStdoutWrite: typeof process.stdout.write;
let origSetInterval: typeof globalThis.setInterval;
let origClearInterval: typeof globalThis.clearInterval;
let origSetTimeout: typeof globalThis.setTimeout;
let origClearTimeout: typeof globalThis.clearTimeout;
const activeIntervals: Map<number, () => void> = new Map();
const activeTimeouts: Map<number, () => void> = new Map();
let idCounter = 0;

beforeEach(() => {
  origStderrWrite = process.stderr.write.bind(process.stderr);
  origStdoutWrite = process.stdout.write.bind(process.stdout);
  origSetInterval = globalThis.setInterval.bind(globalThis);
  origClearInterval = globalThis.clearInterval.bind(globalThis);
  origSetTimeout = globalThis.setTimeout.bind(globalThis);
  origClearTimeout = globalThis.clearTimeout.bind(globalThis);

  process.stderr.write = ((chunk: any) => {
    stderrWrites.push(String(chunk));
    return true;
  }) as any;
  process.stdout.write = ((chunk: any) => {
    stdoutWrites.push(String(chunk));
    return true;
  }) as any;
  globalThis.setInterval = ((cb: (...args: never[]) => unknown) => {
    const id = ++idCounter;
    activeIntervals.set(id, cb as () => void);
    return id as any;
  }) as any;
  globalThis.clearInterval = ((id: any) => {
    activeIntervals.delete(Number(id));
  }) as any;
  globalThis.setTimeout = ((cb: (...args: never[]) => unknown) => {
    const id = ++idCounter;
    activeTimeouts.set(id, cb as () => void);
    return id as any;
  }) as any;
  globalThis.clearTimeout = ((id: any) => {
    activeTimeouts.delete(Number(id));
  }) as any;
});

afterEach(() => {
  stderrWrites.length = 0;
  stdoutWrites.length = 0;
  activeIntervals.clear();
  activeTimeouts.clear();
  idCounter = 0;
  process.stderr.write = origStderrWrite;
  process.stdout.write = origStdoutWrite;
  globalThis.setInterval = origSetInterval;
  globalThis.clearInterval = origClearInterval;
  globalThis.setTimeout = origSetTimeout;
  globalThis.clearTimeout = origClearTimeout;
});

function tick() {
  for (const cb of activeIntervals.values()) cb();
}
function tickTimeout() {
  for (const cb of activeTimeouts.values()) cb();
  activeTimeouts.clear();
}

describe("StatusBar", () => {
  it("manages cursor: hides on start, shows on error/finish/stop", () => {
    const bar = new StatusBar();
    bar.setPhase("work");
    expect(stderrWrites).toContain(CURSOR_HIDE);
    stderrWrites.length = 0;

    bar.setError("fail");
    expect(stderrWrites.join("")).toContain(CURSOR_SHOW);

    bar.setPhase("again");
    stderrWrites.length = 0;
    bar.finish("ok");
    expect(stderrWrites.join("")).toContain(CURSOR_SHOW);
    expect(stdoutWrites.join("")).toContain("ok");

    bar.setPhase("again2");
    stderrWrites.length = 0;
    bar.stop();
    expect(stderrWrites.join("")).toContain(CURSOR_SHOW);
  });

  it("setError dumps history + error to stderr", () => {
    const bar = new StatusBar();
    bar.setPhase("build");
    bar.setWarning("disk low");
    stderrWrites.length = 0;
    bar.setError("build failed");

    const out = stderrWrites.join("");
    expect(out).toContain("build");
    expect(out).toContain("disk low");
    expect(out).toContain("build failed");
  });

  it.each([
    [
      "phase",
      (b: StatusBar) => {
        b.setPhase("building");
        tick();
      },
    ],
    [
      "metrics",
      (b: StatusBar) => {
        b.setMetrics("go", "zones", 1, 2, {
          requests: 100,
          failures: 1,
          totalDuration: 50000,
          durationCount: 100,
          currentVUs: 5,
          elapsedSec: 10,
        });
        tick();
      },
    ],
    [
      "warning",
      (b: StatusBar) => {
        b.setWarning("disk low");
        tick();
      },
    ],
    [
      "done",
      (b: StatusBar) => {
        b.setDone("migrated");
        tick();
      },
    ],
  ] as const)("renders %s mode", (mode, act) => {
    const bar = new StatusBar();
    stderrWrites.length = 0;
    act(bar);
    expect(stderrWrites.join("")).toContain("\r\u001b[2K");
  });

  it("suppresses render after stop", () => {
    const bar = new StatusBar();
    bar.setPhase("building");
    bar.stop();
    stderrWrites.length = 0;
    tick();
    expect(stderrWrites.join("")).toBe("");
  });

  it("setDone resets to idle after timeout, setPhase replaces previous", () => {
    const bar = new StatusBar();
    bar.setPhase("first");
    bar.setPhase("second");
    stderrWrites.length = 0;
    tick();
    expect(stderrWrites.join("")).toContain("second");
    expect(stderrWrites.join("")).not.toContain("first");

    bar.setDone("ok");
    tickTimeout();
    stderrWrites.length = 0;
    tick();
    expect(stderrWrites.join("")).toBe("");
  });

  it("setSubtask appends to phase line", () => {
    const bar = new StatusBar();
    bar.setPhase("migrating");
    bar.setSubtask("applying V003");
    stderrWrites.length = 0;
    tick();
    expect(stderrWrites.join("")).toContain("applying V003");
  });
});
