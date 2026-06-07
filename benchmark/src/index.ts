#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { cleanCommand } from "./commands/clean";
import { compareCommand } from "./commands/compare";
import { runCommand } from "./commands/run";
import { singleCommand } from "./commands/single";

const main = defineCommand({
  meta: {
    name: "bench",
    version: "0.1.0",
    description: "Benchmark CLI for green-algeria-map backends",
  },
  subCommands: {
    run: runCommand,
    single: singleCommand,
    compare: compareCommand,
    clean: cleanCommand,
  },
});

runMain(main);
