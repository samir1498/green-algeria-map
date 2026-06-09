export interface LogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error" | "success" | "phase";
  message: string;
}

export class RingBuffer {
  private buffer: LogEntry[] = [];
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  push(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  get all(): LogEntry[] {
    return [...this.buffer];
  }

  flush(): LogEntry[] {
    const entries = this.buffer;
    this.buffer = [];
    return entries;
  }

  get length(): number {
    return this.buffer.length;
  }
}
