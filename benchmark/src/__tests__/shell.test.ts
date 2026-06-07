import { describe, expect, it } from "bun:test";
import { run } from "../shell";

describe("run", () => {
  it("captures streamed stdout and stderr on failure", async () => {
    const result = await run("sh", ["-c", "echo stdout-line; echo stderr-line >&2; exit 3"], {
      stream: true,
    });

    expect(result.exitCode).toBe(3);
    expect(result.stdout).toBe("stdout-line");
    expect(result.stderr).toBe("stderr-line");
  });
});
