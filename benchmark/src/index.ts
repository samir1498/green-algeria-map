#!/usr/bin/env bun
import pkg from "../package.json" with { type: "json" };
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