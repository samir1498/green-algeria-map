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

async function resolveCommand(cmd: string): Promise<string> {
  const whichResult = Bun.spawn({
    cmd: ["which", cmd],
    stdout: "pipe",
  });

  const exitCode = await whichResult.exited;
  if (exitCode === 0) {
    const path = await new Response(whichResult.stdout).text();
    return path.trim();
  }

  return cmd;
}

export async function run(
  cmd: string,
  args: string[],
  opts: ShellOptions = {},
): Promise<ShellResult> {
  const resolvedCmd = await resolveCommand(cmd);

  try {
    const proc = Bun.spawn({
      cmd: [resolvedCmd, ...args],
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
