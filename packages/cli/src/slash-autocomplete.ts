import {
  createDefaultSlashRegistry,
  createRuntimeSlashRegistry,
  type RuntimeSlashRegistryOptions,
  type SlashRegistry,
  type SlashSuggestion,
  type SlashSuggestionResult
} from "@agent-runtime/core";

export interface SlashComposerOption extends SlashSuggestion {
  preview: string;
}

export interface SlashComposerState {
  input: string;
  currentPath: string;
  breadcrumbs: string[];
  status: SlashSuggestionResult["status"];
  message: string;
  options: SlashComposerOption[];
}

export interface RuntimeSlashComposerOptions extends RuntimeSlashRegistryOptions {}

function inputEndsInWhitespace(input: string): boolean {
  return /\s$/.test(input);
}

function replaceLastToken(input: string, replacement: string): string {
  if (!input.includes(" ")) {
    return input.startsWith("/") ? `/${replacement}` : replacement;
  }

  const prefix = input.replace(/\S*$/, "");
  return `${prefix}${replacement}`;
}

function previewInsertion(input: string, suggestion: SlashSuggestion, state: SlashSuggestionResult): string {
  const appendSpace = suggestion.isLeaf ? "" : " ";

  if (state.status === "partial" || state.status === "unknown") {
    return `${replaceLastToken(input, suggestion.token)}${appendSpace}`;
  }

  if (input === "/") {
    return `/${suggestion.token}${appendSpace}`;
  }

  const separator = inputEndsInWhitespace(input) ? "" : " ";
  return `${input}${separator}${suggestion.token}${appendSpace}`;
}

export function buildSlashComposerState(
  input: string,
  registry: SlashRegistry = createDefaultSlashRegistry()
): SlashComposerState {
  const base = registry.suggest(input);

  return {
    input,
    currentPath: base.currentPath,
    breadcrumbs: base.breadcrumbs,
    status: base.status,
    message: base.message,
    options: base.suggestions.map((suggestion) => ({
      ...suggestion,
      preview: previewInsertion(input, suggestion, base)
    }))
  };
}

export function buildRuntimeSlashComposerState(
  input: string,
  options: RuntimeSlashComposerOptions = {}
): SlashComposerState {
  return buildSlashComposerState(input, createRuntimeSlashRegistry(options));
}
