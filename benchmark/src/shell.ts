export interface ShellResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface ShellOptions {
  cwd?: string;
  stream?: boolean;
  env?: Record<string, string>;
  timeout?: number;
  suppressStderr?: boolean;
}

async function readStream(
  stream: ReadableStream<Uint8Array> | null | undefined,
  forwardTo?: { write: (chunk: string) => unknown },
): Promise<string> {
  if (!stream) return "";

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    output += chunk;
    if (forwardTo && chunk.length > 0) {
      forwardTo.write(chunk);
    }
  }

  const tail = decoder.decode();
  if (tail.length > 0) {
    output += tail;
    if (forwardTo) {
      forwardTo.write(tail);
    }
  }

  return output;
}

export async function run(cmd: string, args: string[], opts: ShellOptions = {}): Promise<ShellResult> {
  try {
    const proc = Bun.spawn({
      cmd: [cmd, ...args],
      cwd: opts.cwd ?? process.cwd(),
      env: { ...process.env, ...opts.env },
      stdout: "pipe",
      stderr: "pipe",
    });

    if (opts.timeout) {
      setTimeout(() => proc.kill(), opts.timeout);
    }

    const stdoutPromise = readStream(proc.stdout, opts.stream ? process.stdout : undefined);
    const stderrPromise = readStream(
      proc.stderr,
      opts.stream && !opts.suppressStderr ? process.stderr : undefined,
    );
    const exitCode = await proc.exited;
    const [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise]);

    return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { exitCode: 1, stdout: "", stderr: errMsg };
  }
}
