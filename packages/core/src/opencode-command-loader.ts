import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { defaultSlashCommandDefinitions } from "./default-slash-commands";
import { createSlashRegistry, type SlashCommandDefinition, type SlashRegistry } from "./slash-registry";

export interface RuntimeSlashRegistryOptions {
  cwd?: string;
  homeDir?: string;
  includeBuiltIns?: boolean;
  includeGlobalCommands?: boolean;
  includeProjectCommands?: boolean;
}

interface ParsedMarkdownCommand {
  description?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
  template: string;
}

function normalizeSummary(token: string): string {
  return `Custom command: ${token}`;
}

function parseFrontmatterValue(value: string): boolean | string {
  const normalized = value.trim();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return normalized.slice(1, -1);
  }
  return normalized;
}

function parseMarkdownCommand(content: string): ParsedMarkdownCommand {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const body = (match?.[2] ?? content).trim();
  const frontmatter = match?.[1] ?? "";
  const parsed: Record<string, boolean | string> = {};

  for (const line of frontmatter.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    parsed[key] = parseFrontmatterValue(rawValue);
  }

  return {
    description: typeof parsed.description === "string" ? parsed.description : undefined,
    agent: typeof parsed.agent === "string" ? parsed.agent : undefined,
    model: typeof parsed.model === "string" ? parsed.model : undefined,
    subtask: typeof parsed.subtask === "boolean" ? parsed.subtask : undefined,
    template: body
  };
}

function walkMarkdownFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  const results: string[] = [];
  const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name)
  );

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(absolutePath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(absolutePath);
    }
  }

  return results;
}

function mergeNodes(
  existing: SlashCommandDefinition,
  incoming: SlashCommandDefinition
): SlashCommandDefinition {
  const existingChildren = existing.children ?? [];
  const incomingChildren = incoming.children ?? [];
  const existingIsLeaf = existingChildren.length === 0;
  const incomingIsLeaf = incomingChildren.length === 0;

  if (existingIsLeaf || incomingIsLeaf) {
    return cloneDefinition(incoming);
  }

  const mergedChildren = mergeDefinitionLists(existingChildren, incomingChildren);
  return {
    ...cloneDefinition(existing),
    children: mergedChildren
  };
}

function cloneDefinition(definition: SlashCommandDefinition): SlashCommandDefinition {
  return {
    ...definition,
    aliases: definition.aliases ? [...definition.aliases] : undefined,
    children: definition.children?.map((child) => cloneDefinition(child)),
    source: definition.source ? { ...definition.source } : undefined
  };
}

function mergeDefinitionLists(
  base: SlashCommandDefinition[],
  incoming: SlashCommandDefinition[]
): SlashCommandDefinition[] {
  const result = base.map((definition) => cloneDefinition(definition));

  for (const next of incoming) {
    const index = result.findIndex(
      (current) => current.token.trim().toLowerCase() === next.token.trim().toLowerCase()
    );

    if (index === -1) {
      result.push(cloneDefinition(next));
      continue;
    }

    result[index] = mergeNodes(result[index]!, next);
  }

  return result;
}

function definitionFromTokens(
  tokens: string[],
  leaf: SlashCommandDefinition
): SlashCommandDefinition {
  const [first, ...rest] = tokens;
  if (!first) {
    throw new Error("Slash command path must include at least one token.");
  }

  if (rest.length === 0) {
    return {
      ...leaf,
      token: first
    };
  }

  return {
    token: first,
    summary: "",
    kind: "category",
    children: [definitionFromTokens(rest, leaf)]
  };
}

function commandPathTokens(commandsDirectory: string, filePath: string): string[] {
  const relativePath = relative(commandsDirectory, filePath);
  return relativePath
    .replace(/\.md$/i, "")
    .split(/[\\/]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function loadCommandDefinitionsFromDirectory(
  commandsDirectory: string,
  sourceKind: "opencode-global" | "opencode-project"
): SlashCommandDefinition[] {
  const definitions: SlashCommandDefinition[] = [];

  for (const filePath of walkMarkdownFiles(commandsDirectory)) {
    const tokens = commandPathTokens(commandsDirectory, filePath);
    if (tokens.length === 0) {
      continue;
    }

    const parsed = parseMarkdownCommand(readFileSync(filePath, "utf8"));
    const leafToken = tokens[tokens.length - 1]!;
    const leaf: SlashCommandDefinition = {
      token: leafToken,
      summary: parsed.description ?? normalizeSummary(leafToken),
      kind: "custom",
      commandId: `${sourceKind}:${relative(commandsDirectory, filePath)}`,
      template: parsed.template,
      agent: parsed.agent,
      model: parsed.model,
      subtask: parsed.subtask,
      source: {
        kind: sourceKind,
        path: filePath
      }
    };

    definitions.push(definitionFromTokens(tokens, leaf));
  }

  return definitions;
}

export function loadOpencodeSlashCommandDefinitions(
  options: RuntimeSlashRegistryOptions = {}
): SlashCommandDefinition[] {
  const definitions: SlashCommandDefinition[] = [];
  const homeDir = options.homeDir ? resolve(options.homeDir) : undefined;
  const cwd = options.cwd ? resolve(options.cwd) : undefined;
  const includeGlobal = options.includeGlobalCommands ?? true;
  const includeProject = options.includeProjectCommands ?? true;

  if (includeGlobal && homeDir) {
    definitions.push(
      ...loadCommandDefinitionsFromDirectory(
        join(homeDir, ".config", "opencode", "commands"),
        "opencode-global"
      )
    );
  }

  if (includeProject && cwd) {
    definitions.push(
      ...loadCommandDefinitionsFromDirectory(join(cwd, ".opencode", "commands"), "opencode-project")
    );
  }

  return definitions;
}

export function createRuntimeSlashRegistry(
  options: RuntimeSlashRegistryOptions = {}
): SlashRegistry {
  const includeBuiltIns = options.includeBuiltIns ?? true;
  const mergedDefinitions = mergeDefinitionLists(
    includeBuiltIns ? defaultSlashCommandDefinitions : [],
    loadOpencodeSlashCommandDefinitions(options)
  );

  return createSlashRegistry(mergedDefinitions);
}
