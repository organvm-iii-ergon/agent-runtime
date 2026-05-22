import { defaultSlashCommandDefinitions } from "./default-slash-commands";
import {
  createRuntimeSlashRegistry,
  loadOpencodeSlashCommandDefinitions,
  type RuntimeSlashRegistryOptions
} from "./opencode-command-loader";
import {
  createSlashRegistry,
  SlashRegistry,
  type SlashCommandDefinition,
  type SlashCommandNode,
  type SlashCommandSource,
  type SlashSuggestion,
  type SlashSuggestionResult,
  type SlashSuggestionStatus
} from "./slash-registry";

export {
  createSlashRegistry,
  createRuntimeSlashRegistry,
  SlashRegistry,
  defaultSlashCommandDefinitions,
  loadOpencodeSlashCommandDefinitions,
  type SlashCommandDefinition,
  type SlashCommandNode,
  type SlashCommandSource,
  type SlashSuggestion,
  type SlashSuggestionResult,
  type SlashSuggestionStatus,
  type RuntimeSlashRegistryOptions
};

export function createDefaultSlashRegistry(): SlashRegistry {
  return createSlashRegistry(defaultSlashCommandDefinitions);
}

export function suggestSlashInput(input: string): SlashSuggestionResult {
  return createDefaultSlashRegistry().suggest(input);
}
