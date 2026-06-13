import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineCommand } from "citty";
import { formatJson, formatMarkdown, formatTable, loadComparisonData, loadDockerStats } from "../report/compare";

async function findLatestResultDir(): Promise<string | null> {
  const resultsDir = resolve(import.meta.dir, "../../results");
  try {
    const entries = await readdir(resultsDir, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && e.name.includes("pipeline"))
      .map((e) => e.name)
      .sort()
      .reverse();
    return dirs.length > 0 ? resolve(resultsDir, dirs[0]) : null;
  } catch {
    return null;
  }
}

export const compareCommand = defineCommand({
  meta: { name: "compare", description: "Compare benchmark results" },
  args: {
    dir: { type: "positional", required: false, description: "Results directory (defaults to latest)" },
    format: { type: "string", alias: "f", default: "table", description: "table, json, or markdown" },
  },
  async run({ args }) {
    const dirArg = args.dir || (await findLatestResultDir());
    if (!dirArg) {
      throw new Error("No results directory specified and no pipeline results found in results/");
    }
    const dir = resolve(dirArg);
    const [backends, stats] = await Promise.all([loadComparisonData(dir), loadDockerStats(dir)]);

    if (backends.size === 0) {
      throw new Error(`No results found in ${dir}`);
    }

    switch (args.format) {
      case "json":
        console.log(formatJson(backends));
        break;
      case "markdown":
        console.log(formatMarkdown(backends, stats));
        break;
      default:
        console.log(formatTable(backends, stats));
    }
  },
});
