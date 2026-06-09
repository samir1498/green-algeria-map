import { status } from "./ui/status";

export function banner(title: string): void {
  status.setPhase(title);
}

export function section(title: string): void {
  status.setPhase(title);
}

export function step(backend: string, message: string): void {
  status.setSubtask(`[${backend}] ${message}`);
}

export function timer(): { stop: () => number } {
  const start = Date.now();
  return { stop: () => Date.now() - start };
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
