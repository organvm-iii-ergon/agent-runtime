# ADR-001: Mixed-stack subsystem split

**Date:** 2026-05-18
**Status:** Accepted
**Deciders:** Conductor + Claude (Opus 4.7)

## Context

The agent-runtime project implements 30 architectural primitives across roughly seven subsystem clusters (core runtime, CLI/TUI, MCP integration, daemon, perf-critical paths, voice, observability). A single-language choice forces tradeoffs that hurt every subsystem; a per-subsystem choice incurs integration cost but lets each subsystem use the strongest ecosystem fit.

The user explicitly chose "Mixed (per subsystem)" in the planning round.

## Decision

| Subsystem | Language | Rationale |
|---|---|---|
| Runtime core (plugin/hook/skill loaders, session manager) | TypeScript | Matches Claude Code's actual implementation; fast iteration; strong type system for the manifest/frontmatter parsers that dominate Phase 1. |
| CLI / REPL / TUI / vim mode / slash commands | TypeScript (+ Ink) | TS Ink renderer is mature for terminal UI; no JS↔native bridge tax for an already-TS-heavy interactive layer. |
| MCP adapters (stdio/SSE/HTTP/WebSocket) | Python | Reuses production substrate at `~/Code/_agent-ontology/` (6 native↔unified adapters + `_base.py` shipped 2026-05-17). Exposes via JSON-RPC bridge to TS core. |
| Background-agent daemon | TypeScript | Shares session/transcript code with core; no benefit to language-switching for what is mostly process-management + IPC. |
| Perf-critical: file search, sandbox helpers, hash/diff | Rust | Native speed matters; ship as optional per-platform deps so npm-installed users don't pay an install cost they can't use. |
| Voice STT bridge | TypeScript (WebSocket) + native audio module | Bundled per-platform binary for capture; control plane in TS. |

## Consequences

**Positive:**
- Each subsystem uses the right tool. Plugin/hook/skill loaders aren't fighting Rust's borrow checker for what is essentially JSON dispatch. MCP adapters reuse battle-tested Python rather than re-deriving the abstraction.
- Three independent test suites (vitest / pytest / cargo test) can run in parallel CI matrices.
- Failure in one subsystem doesn't necessarily cascade — Python MCP adapter death shouldn't crash the TS REPL.

**Negative:**
- Three build systems (pnpm/turborepo + uv + cargo) and three lint/format toolchains (eslint+prettier / ruff / clippy+rustfmt).
- Cross-language IPC (TS↔Python at minimum, TS↔Rust for perf calls). Mitigation: stdin/stdout JSON-RPC, no FFI. NDJSON over named pipes for streaming.
- Contributor onboarding requires three ecosystems.

## Alternatives considered

1. **Pure TypeScript.** Rejected because porting `_agent-ontology`'s Python MCP adapter family to TS throws away ~6 months of working code and a tested abstraction (the `_base.py` pattern). Cost > benefit.
2. **Pure Rust.** Rejected because the runtime is overwhelmingly JSON-dispatch, frontmatter parsing, file I/O, and terminal rendering — all areas where Rust's strengths don't apply and its slower iteration cost would compound across 30 primitives.
3. **TypeScript + Python only (no Rust).** Plausible. Rust is reserved for perf-critical paths only (file search, sandbox helpers). If perf turns out not to matter, Rust dependencies can be removed without restructuring the rest.

## Verification

- Phase 0 builds a no-op CLI that exercises the cross-language seam (TS spawning a Python child, reading JSON-RPC over stdio) to prove the integration model works before Phase 1 builds anything on top.
- Each phase's "definition of done" includes a passing cross-package integration test in CI.

## References

- Plan of record: `~/.claude/plans/implement-all-i-ll-convert-lazy-mitten.md`
- MCP adapter substrate: `~/Code/_agent-ontology/` (per `[[project_artifact_mcp_adapter_family]]` in memory; verify before porting)
