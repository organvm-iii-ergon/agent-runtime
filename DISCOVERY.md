# Discovery — organvm/agent-runtime

_Auto-discovery 2026-06-22. This file records the discovered latent value so the repo is never re-discovered from scratch._

## Verdict: REAL VALUE — promote to ranked tier

## Value thesis

`agent-runtime` advertises itself as a from-scratch reimplementation of ~30 Claude Code
primitives, and that grand vision is still aspirational scaffolding (Phase 0/early Phase 1:
mostly READMEs, ADRs, and empty package stubs). But buried inside the only built vertical slice
is a genuinely reusable, dependency-free, fully-typed asset that already builds and passes 14
tests: **a hierarchical slash-command registry plus an OpenCode-compatible markdown command
loader.** Concretely, `@agent-runtime/core` parses the de-facto OpenCode/Claude-Code custom-command
convention — frontmatter (`description`/`agent`/`model`/`subtask`) plus nested directories that map
to deep slash paths (`.opencode/commands/workflow/review/frontend.md` → `/workflow review frontend`)
— merges built-in, global (`~/.config/opencode/commands`), and project (`.opencode/commands`)
command trees with correct project-over-global-over-builtin override precedence, and emits a
suggestion/autocomplete state machine (root/partial/next/leaf/unknown, breadcrumbs, alias prefix
matching) that any TUI, REPL, or editor frontend can render. That is the latent value: not the
unbuilt 30-primitive runtime, but a clean **command-surface library** that the rest of the estate
can consume instead of re-implementing markdown-command parsing, tree merging, and `/...`
autocomplete. It is a reusable capability and the credible seed of a small published package, so it
belongs in the ranked tier — not the archive.

## What's actually built (verified 2026-06-22)

- `@agent-runtime/core` — typed `SlashRegistry`, suggestion engine, `loadOpencodeSlashCommandDefinitions`,
  `createRuntimeSlashRegistry` (builtin + global + project merge). 10 passing tests.
- `@agent-runtime/cli` — `buildRuntimeSlashComposerState`: partial `/...` → autocomplete options with
  preview-insertion strings. 4 passing tests.
- `apps/bin` — `agent slash suggest "<input>"` demo binary exercising the slice end-to-end.
- `pnpm build` and `pnpm test` both green.

## Honest limits

- The 29 other primitives (hooks, subagents, MCP, sessions, worktrees, scheduling, voice, TUI, …)
  are README/RFC placeholders with no implementation.
- The registry can _suggest_ and _match_ commands but cannot yet _resolve_ a completed input to an
  executable payload — `suggest()` exposes `matchedCommandId` but there is no public
  `resolve(input)` API and nothing dispatches/executes a command.
- Python (`mcp-adapters`) and Rust (`perf-tools`) packages are empty scaffolds.

## Single best concrete first task

**Add command resolution to `@agent-runtime/core`: a `resolve(input): ResolvedCommand | null` API
(and an `agent slash run "<input>"` CLI path) that walks a completed `/...` input to its leaf
`SlashCommandNode` and returns the resolved payload — `commandId`, `template`, `agent`, `model`,
`subtask`, and `source`.** The loader already captures all of this from markdown frontmatter; the
registry already navigates the tree. Resolution is the missing keystone that turns the slice from
"autocomplete-only" into an actually invokable command layer — the precondition every downstream
frontend and the broader runtime needs. It is small, testable, and immediately raises the asset's
reuse value.
