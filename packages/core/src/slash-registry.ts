export interface SlashCommandDefinition {
  token: string;
  summary: string;
  kind?: string;
  commandId?: string;
  aliases?: string[];
  template?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
  source?: SlashCommandSource;
  children?: SlashCommandDefinition[];
}

export interface SlashCommandSource {
  kind: "builtin" | "opencode-global" | "opencode-project";
  path?: string;
}

export interface SlashCommandNode {
  token: string;
  summary: string;
  kind: string;
  commandId?: string;
  aliases: string[];
  template?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
  source?: SlashCommandSource;
  path: string[];
  children: SlashCommandNode[];
}

export interface SlashSuggestion {
  token: string;
  summary: string;
  kind: string;
  path: string;
  commandId?: string;
  aliases: string[];
  source?: SlashCommandSource;
  isLeaf: boolean;
}

export type SlashSuggestionStatus =
  | "not-slash"
  | "root"
  | "partial"
  | "next"
  | "leaf"
  | "unknown";

export interface SlashSuggestionResult {
  input: string;
  status: SlashSuggestionStatus;
  currentPath: string;
  breadcrumbs: string[];
  suggestions: SlashSuggestion[];
  pendingToken?: string;
  matchedCommandId?: string;
  message: string;
}

interface SlashRegistryNode extends SlashCommandNode {
  lookup: Map<string, SlashRegistryNode>;
}

function normalizeToken(token: string): string {
  return token.trim().toLowerCase();
}

function toSuggestion(node: SlashCommandNode): SlashSuggestion {
  return {
    token: node.token,
    summary: node.summary,
    kind: node.kind,
    path: `/${node.path.join(" ")}`,
    commandId: node.commandId,
    aliases: node.aliases,
    source: node.source,
    isLeaf: node.children.length === 0
  };
}

function createNode(
  definition: SlashCommandDefinition,
  parentPath: string[] = []
): SlashRegistryNode {
  const token = normalizeToken(definition.token);
  if (!token) {
    throw new Error("Slash command tokens must not be empty.");
  }

  const aliases = [...new Set((definition.aliases ?? []).map(normalizeToken).filter(Boolean))];
  const path = [...parentPath, token];
  const children = (definition.children ?? []).map((child) => createNode(child, path));
  const lookup = new Map<string, SlashRegistryNode>();

  for (const child of children) {
    const siblingKeys = [child.token, ...child.aliases];
    for (const key of siblingKeys) {
      if (lookup.has(key)) {
        throw new Error(`Duplicate slash token or alias "${key}" under /${path.join(" ")}.`);
      }
      lookup.set(key, child);
    }
  }

  return {
    token,
    summary: definition.summary.trim(),
    kind: definition.kind ?? "command",
    commandId: definition.commandId,
    aliases,
    template: definition.template,
    agent: definition.agent,
    model: definition.model,
    subtask: definition.subtask,
    source: definition.source,
    path,
    children,
    lookup
  };
}

function findExact(children: SlashRegistryNode[], token: string): SlashRegistryNode | undefined {
  const normalized = normalizeToken(token);
  for (const child of children) {
    if (child.token === normalized || child.aliases.includes(normalized)) {
      return child;
    }
  }
  return undefined;
}

function findMatches(children: SlashRegistryNode[], token: string): SlashSuggestion[] {
  const normalized = normalizeToken(token);
  const matches = children.filter((child) => {
    if (child.token.startsWith(normalized)) {
      return true;
    }
    return child.aliases.some((alias) => alias.startsWith(normalized));
  });

  return matches
    .sort((left, right) => left.token.localeCompare(right.token))
    .map((child) => toSuggestion(child));
}

function listChildren(children: SlashRegistryNode[]): SlashSuggestion[] {
  return [...children]
    .sort((left, right) => left.token.localeCompare(right.token))
    .map((child) => toSuggestion(child));
}

function tokenizeSlashInput(input: string): { tokens: string[]; trailingSpace: boolean } {
  const withoutSlash = input.slice(1);
  const trailingSpace = /\s$/.test(input);
  const trimmed = withoutSlash.trim();

  if (!trimmed) {
    return { tokens: [], trailingSpace };
  }

  return { tokens: trimmed.split(/\s+/), trailingSpace };
}

export class SlashRegistry {
  private readonly roots: SlashRegistryNode[];

  public constructor(definitions: SlashCommandDefinition[]) {
    this.roots = definitions.map((definition) => createNode(definition));
    const lookup = new Map<string, SlashRegistryNode>();

    for (const root of this.roots) {
      const siblingKeys = [root.token, ...root.aliases];
      for (const key of siblingKeys) {
        if (lookup.has(key)) {
          throw new Error(`Duplicate root slash token or alias "${key}".`);
        }
        lookup.set(key, root);
      }
    }
  }

  public listRootSuggestions(): SlashSuggestion[] {
    return listChildren(this.roots);
  }

  public suggest(input: string): SlashSuggestionResult {
    if (!input.startsWith("/")) {
      return {
        input,
        status: "not-slash",
        currentPath: "",
        breadcrumbs: [],
        suggestions: [],
        message: "Slash suggestions activate only for inputs that start with '/'."
      };
    }

    const { tokens, trailingSpace } = tokenizeSlashInput(input);
    if (tokens.length === 0) {
      return {
        input,
        status: "root",
        currentPath: "/",
        breadcrumbs: [],
        suggestions: this.listRootSuggestions(),
        message: "Choose a slash command family."
      };
    }

    let children = this.roots;
    const matchedPath: string[] = [];
    let lastMatchedNode: SlashRegistryNode | undefined;

    const exactCount = trailingSpace ? tokens.length : Math.max(tokens.length - 1, 0);
    for (let index = 0; index < exactCount; index += 1) {
      const token = tokens[index]!;
      const exact = findExact(children, token);
      if (!exact) {
        return {
          input,
          status: "unknown",
          currentPath: matchedPath.length > 0 ? `/${matchedPath.join(" ")}` : "/",
          breadcrumbs: [...matchedPath],
          pendingToken: token,
          suggestions: findMatches(children, token),
          message: `No command segment matched "${token}".`
        };
      }

      matchedPath.push(exact.token);
      lastMatchedNode = exact;
      children = exact.children as SlashRegistryNode[];
    }

    if (trailingSpace) {
      return {
        input,
        status: children.length === 0 ? "leaf" : "next",
        currentPath: `/${matchedPath.join(" ")}`,
        breadcrumbs: [...matchedPath],
        suggestions: listChildren(children),
        matchedCommandId: children.length === 0 ? lastMatchedNode?.commandId : undefined,
        message:
          children.length === 0
            ? `/${matchedPath.join(" ")} is complete.`
            : `Choose the next segment after /${matchedPath.join(" ")}.`
      };
    }

    const lastToken = tokens[tokens.length - 1]!;
    const exact = findExact(children, lastToken);

    if (exact) {
      const nextSuggestions = listChildren(exact.children as SlashRegistryNode[]);
      const currentPath = `/${[...matchedPath, exact.token].join(" ")}`;

      return {
        input,
        status: exact.children.length === 0 ? "leaf" : "next",
        currentPath,
        breadcrumbs: [...matchedPath, exact.token],
        suggestions: nextSuggestions,
        matchedCommandId: exact.commandId,
        message:
          exact.children.length === 0
            ? `${currentPath} is complete.`
            : `Choose the next segment after ${currentPath}.`
      };
    }

    return {
      input,
      status: "partial",
      currentPath: matchedPath.length > 0 ? `/${matchedPath.join(" ")}` : "/",
      breadcrumbs: [...matchedPath],
      pendingToken: lastToken,
      suggestions: findMatches(children, lastToken),
      message: `Complete "${lastToken}" with one of the matching slash segments.`
    };
  }
}

export function createSlashRegistry(
  definitions: SlashCommandDefinition[]
): SlashRegistry {
  return new SlashRegistry(definitions);
}
