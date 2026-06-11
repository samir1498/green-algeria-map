#!/usr/bin/env bun
import pkg from "../package.json" with { type: "json" };
import { defineCommand, runMain } from "citty";

import { cleanCommand } from "./commands/clean";
import { compareCommand } from "./commands/compare";
import { runCommand } from "./commands/run";

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
