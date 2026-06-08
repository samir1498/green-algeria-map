import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineCommand } from "citty";
import { formatJson, formatMarkdown, formatTable, loadComparisonData } from "../report/compare";

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
      console.error("No results directory specified and no pipeline results found in results/");
      process.exit(1);
    }
    const dir = resolve(dirArg);
    const backends = await loadComparisonData(dir);

    if (backends.size === 0) {
      console.error("No results found in", dir);
      process.exit(1);
    }

    switch (args.format) {
      case "json":
        console.log(formatJson(backends));
        break;
      case "markdown":
        console.log(formatMarkdown(backends));
        break;
      default:
        console.log(formatTable(backends));
    }
  },
});
