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

export interface ProgressDisplay {
  update(metrics: LiveMetrics): void;
  done(metrics: LiveMetrics, exitCode: number): void;
  fail(error: string): void;
  stop(): void;
}

function fmtElapsed(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}

function buildLine(
  backend: string,
  scenario: string,
  runIndex: number,
  totalRuns: number,
  metrics: LiveMetrics,
): string {
  const elapsed = fmtElapsed(metrics.elapsedSec);
  const rps = metrics.elapsedSec > 0 ? (metrics.requests / metrics.elapsedSec).toFixed(0) : "0";
  const failPct = metrics.requests > 0 ? ((metrics.failures / metrics.requests) * 100).toFixed(1) : "0.0";
  const avgDur = metrics.durationCount > 0 ? (metrics.totalDuration / metrics.durationCount).toFixed(0) : "\u2014";
  return `${backend} \u00b7 ${scenario} (${runIndex}/${totalRuns}) \u00b7 ${elapsed} \u00b7 ${metrics.requests.toLocaleString()} reqs \u00b7 \u2205${avgDur}ms \u00b7 ${failPct}% fail \u00b7 ${rps} r/s \u00b7 ${metrics.currentVUs} VUs`;
}

export function createProgressDisplay(
  backend: string,
  scenario: string,
  runIndex: number,
  totalRuns: number,
): ProgressDisplay {
  let stopped = false;

  process.stderr.write(CURSOR_HIDE);

  const render = (prefix: string, metrics: LiveMetrics): string => {
    return `${CLEAR_LINE}${prefix} ${buildLine(backend, scenario, runIndex, totalRuns, metrics)}`;
  };

  return {
    update(metrics: LiveMetrics) {
      if (stopped) return;
      process.stderr.write(render("\u25cb", metrics));
    },

    done(metrics: LiveMetrics, exitCode: number) {
      if (stopped) return;
      stopped = true;
      const ok = exitCode === 0 || exitCode === 99;
      const prefix = ok ? "\u2713" : "\u2717";
      process.stderr.write(`${render(prefix, metrics)}\n`);
      process.stderr.write(CURSOR_SHOW);
    },

    fail(error: string) {
      if (stopped) return;
      stopped = true;
      process.stderr.write(
        `${CLEAR_LINE}\u2717 ${backend} \u00b7 ${scenario} (${runIndex}/${totalRuns}) \u00b7 FAILED: ${error}\n`,
      );
      process.stderr.write(CURSOR_SHOW);
    },

    stop() {
      if (stopped) return;
      stopped = true;
      process.stderr.write(CURSOR_SHOW);
    },
  };
}
