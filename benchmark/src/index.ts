#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { cleanCommand } from "./commands/clean";
import { compareCommand } from "./commands/compare";
import { runCommand } from "./commands/run";

const main = defineCommand({
  meta: {
    name: "bench",
    version: "0.3.0",
    description: "Benchmark CLI for green-algeria-map backends",
  },
  subCommands: {
    run: runCommand,
    compare: compareCommand,
    clean: cleanCommand,
  },
});

runMain(main);
