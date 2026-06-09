import { type LogEntry, RingBuffer } from "./history";

const CURSOR_HIDE = "\u001b[?25l";
const CURSOR_SHOW = "\u001b[?25h";
const CLEAR_LINE = "\r\u001b[2K";

export interface LiveMetrics {
  requests: number;
  failures: number;
  totalDuration: number;
  durationCount: number;
  currentVUs: number;
  elapsedSec: number;
}

type StatusMode = "phase" | "subprocess" | "metrics" | "warning" | "done" | "idle";

interface StatusState {
  mode: StatusMode;
  phase: string;
  subPhase: string;
  metrics: LiveMetrics | null;
  metricsLabel: string;
  warning: string;
  doneMessage: string;
  doneTimer: ReturnType<typeof setTimeout> | null;
  startedAt: number;
  backend: string;
  scenario: string;
  runIndex: number;
  totalRuns: number;
  verbose: boolean;
}

export class StatusBar {
  private state: StatusState;
  private history: RingBuffer;
  private renderTimer: ReturnType<typeof setInterval> | null = null;
  private stopped = false;

  constructor() {
    this.state = this.defaultState();
    this.history = new RingBuffer(50);
  }

  private defaultState(): StatusState {
    return {
      mode: "idle",
      phase: "",
      subPhase: "",
      metrics: null,
      metricsLabel: "",
      warning: "",
      doneMessage: "",
      doneTimer: null,
      startedAt: 0,
      backend: "",
      scenario: "",
      runIndex: 0,
      totalRuns: 0,
      verbose: false,
    };
  }

  setVerbose(v: boolean): void {
    this.state.verbose = v;
  }

  setPhase(phase: string): void {
    this.history.push({ timestamp: new Date(), level: "phase", message: phase });
    this.state.mode = "phase";
    this.state.phase = phase;
    this.state.subPhase = "";
    this.state.startedAt = Date.now();
    this.startRender();
  }

  setSubtask(sub: string): void {
    this.state.subPhase = sub;
  }

  setWarning(msg: string): void {
    this.history.push({ timestamp: new Date(), level: "warn", message: msg });
    this.state.mode = "warning";
    this.state.warning = msg;
    this.startRender();
  }

  setDone(msg: string): void {
    this.history.push({ timestamp: new Date(), level: "success", message: msg });
    this.state.mode = "done";
    this.state.doneMessage = msg;
    this.state.startedAt = Date.now();
    if (this.state.doneTimer) clearTimeout(this.state.doneTimer);
    this.state.doneTimer = setTimeout(() => {
      if (this.state.mode === "done") {
        this.state.mode = "idle";
      }
    }, 2000);
    this.startRender();
  }

  setMetrics(backend: string, scenario: string, runIndex: number, totalRuns: number, metrics: LiveMetrics): void {
    this.state.mode = "metrics";
    this.state.backend = backend;
    this.state.scenario = scenario;
    this.state.runIndex = runIndex;
    this.state.totalRuns = totalRuns;
    this.state.metrics = metrics;
    if (this.state.startedAt === 0) this.state.startedAt = Date.now();
    this.startRender();
  }

  setError(err: string): void {
    this.stopRender();
    process.stderr.write(CURSOR_SHOW);
    process.stderr.write("\n");

    const entries = this.history.flush();
    for (const entry of entries) {
      const prefix =
        entry.level === "error" ? "✗" : entry.level === "warn" ? "⚠" : entry.level === "success" ? "✓" : "·";
      process.stderr.write(`  ${prefix} ${entry.message}\n`);
    }

    process.stderr.write(`\n✗ ${err}\n`);
  }

  finish(finalMessage: string): void {
    this.stopRender();
    process.stderr.write(CURSOR_SHOW);
    process.stderr.write("\n");
    process.stdout.write(`${finalMessage}\n`);
  }

  private startRender(): void {
    if (this.renderTimer) return;
    process.stderr.write(CURSOR_HIDE);
    this.renderTimer = setInterval(() => this.render(), 100);
  }

  private stopRender(): void {
    if (this.renderTimer) {
      clearInterval(this.renderTimer);
      this.renderTimer = null;
    }
  }

  private render(): void {
    if (this.stopped) return;

    let line = "";

    switch (this.state.mode) {
      case "phase":
      case "subprocess": {
        const elapsed = this.state.startedAt > 0 ? this.fmtElapsed((Date.now() - this.state.startedAt) / 1000) : "0s";
        const spinner = this.spinner();
        const sub = this.state.subPhase ? ` ${this.state.subPhase}` : "";
        line = `${spinner} ${elapsed}  ${this.state.phase}${sub}`;
        break;
      }
      case "warning":
        line = `⚠ ${this.state.warning}`;
        break;
      case "done": {
        const elapsed = this.state.startedAt > 0 ? this.fmtElapsed((Date.now() - this.state.startedAt) / 1000) : "0s";
        line = `✓ ${elapsed} ${this.state.doneMessage}`;
        break;
      }
      case "metrics": {
        const m = this.state.metrics;
        if (!m) break;
        const elapsed = this.fmtElapsed(m.elapsedSec);
        const rps = m.elapsedSec > 0 ? (m.requests / m.elapsedSec).toFixed(0) : "0";
        const failPct = m.requests > 0 ? ((m.failures / m.requests) * 100).toFixed(1) : "0.0";
        const avgDur = m.durationCount > 0 ? (m.totalDuration / m.durationCount).toFixed(0) : "—";
        line = `🟢 ${this.state.backend} · ${this.state.scenario} (${this.state.runIndex}/${this.state.totalRuns}) · ${elapsed} · ${m.requests.toLocaleString()} reqs · ∅${avgDur}ms · ${failPct}% fail · ${rps} r/s · ${m.currentVUs} VUs`;
        break;
      }
      case "idle":
        return;
    }

    if (line) {
      process.stderr.write(`${CLEAR_LINE}${line}`);
    }
  }

  private spinIndex = 0;
  private spinner(): string {
    const frames = ["🔄", "🔄", "🔄", "🔄"];
    this.spinIndex = (this.spinIndex + 1) % frames.length;
    return frames[this.spinIndex];
  }

  private fmtElapsed(sec: number): string {
    if (sec < 60) return `[${Math.round(sec)}s]`;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `[${m}m ${s}s]`;
  }

  stop(): void {
    this.stopped = true;
    this.stopRender();
    process.stderr.write(CURSOR_SHOW);
    process.stderr.write("\n");
  }
}

export const status = new StatusBar();
