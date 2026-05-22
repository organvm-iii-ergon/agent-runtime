import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createRuntimeSlashRegistry,
  createDefaultSlashRegistry,
  createSlashRegistry,
  defaultSlashCommandDefinitions,
  loadOpencodeSlashCommandDefinitions
} from "./index";

describe("SlashRegistry", () => {
  it("lists the root command families", () => {
    const registry = createDefaultSlashRegistry();
    const result = registry.suggest("/");

    expect(result.status).toBe("root");
    expect(result.suggestions.map((entry) => entry.token)).toEqual([
      "action",
      "agent",
      "function",
      "plugin",
      "skill",
      "workflow"
    ]);
  });

  it("offers next decisions after an exact segment", () => {
    const registry = createDefaultSlashRegistry();
    const result = registry.suggest("/agent ");

    expect(result.status).toBe("next");
    expect(result.currentPath).toBe("/agent");
    expect(result.suggestions.map((entry) => entry.token)).toEqual([
      "inspect",
      "resume",
      "summon"
    ]);
  });

  it("filters partial matches for the current token", () => {
    const registry = createDefaultSlashRegistry();
    const result = registry.suggest("/plugin inst");

    expect(result.status).toBe("partial");
    expect(result.pendingToken).toBe("inst");
    expect(result.suggestions.map((entry) => entry.token)).toEqual(["install"]);
  });

  it("walks deeper into the tree after multiple words", () => {
    const registry = createDefaultSlashRegistry();
    const result = registry.suggest("/agent summon ");

    expect(result.status).toBe("next");
    expect(result.suggestions.map((entry) => entry.token)).toEqual([
      "implementer",
      "planner",
      "reviewer"
    ]);
  });

  it("marks a leaf command as complete", () => {
    const registry = createDefaultSlashRegistry();
    const result = registry.suggest("/workflow run review");

    expect(result.status).toBe("leaf");
    expect(result.currentPath).toBe("/workflow run review");
    expect(result.matchedCommandId).toBe("workflow.run.review");
    expect(result.suggestions).toEqual([]);
  });

  it("supports alias lookup and surfaces the canonical path", () => {
    const registry = createSlashRegistry([
      {
        token: "workflow",
        summary: "Workflow commands.",
        children: [
          {
            token: "run",
            aliases: ["go"],
            summary: "Run a workflow.",
            children: [
              {
                token: "review",
                summary: "Run the review workflow.",
                commandId: "workflow.run.review"
              }
            ]
          }
        ]
      }
    ]);

    const result = registry.suggest("/workflow go ");

    expect(result.status).toBe("next");
    expect(result.currentPath).toBe("/workflow run");
    expect(result.suggestions.map((entry) => entry.token)).toEqual(["review"]);
  });

  it("rejects duplicate sibling tokens or aliases", () => {
    expect(() =>
      createSlashRegistry([
        {
          token: "agent",
          summary: "Agent commands.",
          children: [
            { token: "summon", summary: "Summon a role." },
            { token: "inspect", aliases: ["summon"], summary: "Inspect state." }
          ]
        }
      ])
    ).toThrow('Duplicate slash token or alias "summon" under /agent.');
  });

  it("keeps the default definitions internally valid", () => {
    expect(() => createSlashRegistry(defaultSlashCommandDefinitions)).not.toThrow();
  });

  it("loads project and global OpenCode markdown commands", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "agent-runtime-opencode-"));
    const homeDir = join(tempRoot, "home");
    const cwd = join(tempRoot, "workspace");
    const globalDir = join(homeDir, ".config", "opencode", "commands");
    const projectDir = join(cwd, ".opencode", "commands");

    mkdirSync(globalDir, { recursive: true });
    mkdirSync(join(projectDir, "workflow", "review"), { recursive: true });

    writeFileSync(
      join(globalDir, "test.md"),
      ["---", "description: Global test command", "agent: build", "---", "Run the global tests."].join(
        "\n"
      )
    );
    writeFileSync(
      join(projectDir, "test.md"),
      ["---", "description: Project test command", "subtask: true", "---", "Run the project tests."].join(
        "\n"
      )
    );
    writeFileSync(
      join(projectDir, "workflow", "review", "frontend.md"),
      ["---", "description: Review the frontend slice", "---", "Review the frontend."].join("\n")
    );

    const loaded = loadOpencodeSlashCommandDefinitions({ cwd, homeDir });
    const registry = createRuntimeSlashRegistry({ cwd, homeDir });
    const root = registry.suggest("/");
    const workflow = registry.suggest("/workflow review ");

    expect(loaded).toHaveLength(3);
    expect(root.suggestions.find((entry) => entry.token === "test")?.summary).toBe(
      "Project test command"
    );
    expect(workflow.status).toBe("next");
    expect(workflow.suggestions.map((entry) => entry.token)).toContain("frontend");
  });

  it("allows OpenCode markdown commands to override built-in paths", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "agent-runtime-opencode-override-"));
    const cwd = join(tempRoot, "workspace");
    const projectDir = join(cwd, ".opencode", "commands");

    mkdirSync(projectDir, { recursive: true });
    writeFileSync(
      join(projectDir, "agent.md"),
      ["---", "description: Override the built-in /agent command", "---", "Custom agent command."].join(
        "\n"
      )
    );

    const registry = createRuntimeSlashRegistry({ cwd, homeDir: join(tempRoot, "home") });
    const result = registry.suggest("/agent ");
    const root = registry.suggest("/");

    expect(root.suggestions.find((entry) => entry.token === "agent")?.summary).toBe(
      "Override the built-in /agent command"
    );
    expect(result.status).toBe("leaf");
    expect(result.suggestions).toEqual([]);
  });
});
