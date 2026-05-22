import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildRuntimeSlashComposerState, buildSlashComposerState } from "./index";

describe("buildSlashComposerState", () => {
  it("previews root-level completions with a trailing space for non-leaf nodes", () => {
    const result = buildSlashComposerState("/");

    expect(result.status).toBe("root");
    expect(result.options.find((entry) => entry.token === "agent")?.preview).toBe("/agent ");
  });

  it("previews deep completions by appending the next token", () => {
    const result = buildSlashComposerState("/agent summon ");

    expect(result.options.find((entry) => entry.token === "planner")?.preview).toBe(
      "/agent summon planner"
    );
  });

  it("replaces the partial token when narrowing suggestions", () => {
    const result = buildSlashComposerState("/workflow ru");

    expect(result.status).toBe("partial");
    expect(result.options.find((entry) => entry.token === "run")?.preview).toBe("/workflow run ");
  });

  it("surfaces project OpenCode markdown commands in runtime mode", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "agent-runtime-cli-opencode-"));
    const cwd = join(tempRoot, "workspace");
    const projectDir = join(cwd, ".opencode", "commands");

    mkdirSync(projectDir, { recursive: true });
    writeFileSync(
      join(projectDir, "review-changes.md"),
      ["---", "description: Review recent changes", "---", "Review the recent diff."].join("\n")
    );

    const result = buildRuntimeSlashComposerState("/rev", {
      cwd,
      homeDir: join(tempRoot, "home")
    });

    expect(result.status).toBe("partial");
    expect(result.options.find((entry) => entry.token === "review-changes")?.preview).toBe(
      "/review-changes"
    );
  });
});
