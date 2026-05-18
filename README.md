# agent-runtime

A from-scratch agent runtime implementing 30 architectural primitives modeled on Claude Code's design: plugin system, hooks, skills, slash commands, subagents, permission rules, MCP integration, sessions, worktree isolation, voice, scheduling, remote control, TUI, vim mode, OpenTelemetry, goal-directed execution, and more.

**Status:** Phase 0 scaffold. Nothing builds yet.

## Layout

```
packages/
  core/          TypeScript — runtime, plugin loader, hook dispatcher, skill loader, session manager
  cli/           TypeScript — REPL, TUI renderer, slash commands, vim mode, keybindings
  mcp-adapters/  Python    — MCP client adapters (stdio/SSE/HTTP/WebSocket)
  daemon/        TypeScript — background-agent daemon, /loop and /schedule executor
  perf-tools/    Rust      — file search, sandbox helpers, hash/diff
apps/bin/        Per-platform native binary launcher (optional deps)
docs/
  adrs/          Architecture Decision Records
  rfcs/          One RFC per primitive
tests/
  unit/          Per-package unit tests
  integration/   Cross-package integration tests
  e2e/           CLI smoke tests
```

## Plan of record

The full 7-phase roadmap (~6 months) lives at `docs/PLAN.md` (mirrored from `~/.claude/plans/implement-all-i-ll-convert-lazy-mitten.md`).

## Stack split

| Subsystem | Language |
|---|---|
| Runtime core, plugin/hook/skill loaders, sessions, daemon | TypeScript |
| CLI, REPL, TUI, vim mode, slash commands | TypeScript (+ Ink) |
| MCP adapters | Python |
| File search, sandbox, hash/diff | Rust |

## Universal rules (inherited from `~/.claude/CLAUDE.md`)

1. N/A is a vacuum — every N/A becomes a named work item.
2. Nothing local only — every artifact git-tracked AND pushed.
3. Rules are additive — new rules amend, never overwrite.
4. Conductor principle — the human directs vision; the system does everything else.
5. Plans are artifacts — commit and push after writing; never overwrite, version with `-v2`/`-v3`.
6. Fix bases, not outputs — modify the template/source/pipeline, never the rendered output.
7. Audit before building — check existing tooling before creating new structure.
8. No LaunchAgents — on-demand CLI only. HARD RULE.
