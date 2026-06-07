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
}

export async function run(
  cmd: string,
  args: string[],
  opts: ShellOptions = {},
): Promise<ShellResult> {
  try {
    const proc = Bun.spawn({
      cmd: [cmd, ...args],
      cwd: opts.cwd ?? process.cwd(),
      env: { ...process.env, ...opts.env },
      stdout: opts.stream ? "inherit" : "pipe",
      stderr: opts.stream ? "inherit" : "pipe",
    });

    if (opts.timeout) {
      setTimeout(() => proc.kill(), opts.timeout);
    }

    const exitCode = await proc.exited;
    const stdout = opts.stream ? "" : await new Response(proc.stdout).text();
    const stderr = opts.stream ? "" : await new Response(proc.stderr).text();

    return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { exitCode: 1, stdout: "", stderr: errMsg };
  }
}
