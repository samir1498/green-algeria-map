#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineCommand, runMain } from "citty";
import { cleanCommand } from "./commands/clean";
import { compareCommand } from "./commands/compare";
import { runCommand } from "./commands/run";

const pkgPath = join(import.meta.dir, "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
const VERSION = pkg.version;

const main = defineCommand({
  meta: {
    name: "bench",
    version: VERSION,
    description: "Benchmark CLI for green-algeria-map backends",
  },
  subCommands: {
    run: runCommand,
    compare: compareCommand,
    clean: cleanCommand,
  },
});

runMain(main);