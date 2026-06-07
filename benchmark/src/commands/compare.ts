import { resolve } from "node:path";
import { defineCommand } from "citty";
import { formatJson, formatMarkdown, formatTable, loadComparisonData } from "../report/compare";

export const compareCommand = defineCommand({
  meta: { name: "compare", description: "Compare benchmark results" },
  args: {
    dir: { type: "positional", required: true, description: "Results directory" },
    format: { type: "string", alias: "f", default: "table", description: "table, json, or markdown" },
  },
  async run({ args }) {
    const dir = resolve(args.dir);
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
