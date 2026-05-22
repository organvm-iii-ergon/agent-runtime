#!/usr/bin/env node

import { homedir } from "node:os";

import { buildRuntimeSlashComposerState } from "@agent-runtime/cli";

function printUsage(): void {
  process.stdout.write(
    [
      "agent-runtime demo CLI",
      "",
      "Usage:",
      "  agent --version",
      '  agent slash suggest "/agent summon "',
      ""
    ].join("\n")
  );
}

function printSuggestions(input: string): void {
  const state = buildRuntimeSlashComposerState(input, {
    cwd: process.cwd(),
    homeDir: homedir()
  });

  process.stdout.write(`Input: ${JSON.stringify(input)}\n`);
  process.stdout.write(`Status: ${state.status}\n`);
  process.stdout.write(`Path: ${state.currentPath || "/"}\n`);
  process.stdout.write(`${state.message}\n`);

  if (state.options.length === 0) {
    process.stdout.write("Suggestions: none\n");
    return;
  }

  process.stdout.write("Suggestions:\n");
  for (const option of state.options) {
    process.stdout.write(`- ${option.token}: ${option.summary}\n`);
    process.stdout.write(`  Preview: ${option.preview}\n`);
  }
}

function main(argv: string[]): number {
  const args = argv.slice(2);

  if (args.length === 0) {
    printUsage();
    return 0;
  }

  if (args[0] === "--version") {
    process.stdout.write("0.0.0\n");
    return 0;
  }

  if (args[0] === "slash" && args[1] === "suggest") {
    const input = args.slice(2).join(" ");
    if (!input) {
      process.stderr.write('Expected slash input after `agent slash suggest`.\n');
      return 1;
    }

    printSuggestions(input);
    return 0;
  }

  printUsage();
  return 1;
}

process.exitCode = main(process.argv);
