# Plan of Record

This is the in-repo mirror of the planning artifact at:
`~/.claude/plans/implement-all-i-ll-convert-lazy-mitten.md`

The plan there is canonical (versioned in chezmoi); this file ensures the repo is self-describing per Universal Rule #5 (plans are artifacts — commit and push).

See `docs/adrs/001-stack-split.md` for the stack-split rationale and `docs/rfcs/` for per-primitive design once Phase 1 begins.

## Phases

- **Phase 0 — Foundation** (Week 1) — repo scaffold, CI, empty CLI
- **Phase 1 — Core Spine** (Weeks 2-5) — plugin / hooks / skills / slash / permissions
- **Phase 2 — Agent Runtime** (Weeks 6-10) — subagents, MCP, ToolSearch, sessions, compaction
- **Phase 3 — Multi-agent + Persistence** (Weeks 11-14) — agent teams, background agents, rewind, worktrees, scheduling
- **Phase 4 — I/O + Polish** (Weeks 15-18) — TUI, vim mode, keybindings, voice, image paste
- **Phase 5 — External Integration** (Weeks 19-22) — remote control, auto-mode classifier, OTel, /goal, streaming
- **Phase 6 — Hardening** (Weeks 23-26) — HTTP/MCP/prompt hooks, strictKnownMarketplaces, TRACEPARENT, polish

## Phase 0 status (this session)

Done:
- Directory layout created
- `git init -b main`
- Root manifests: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `pyproject.toml`, `Cargo.toml`
- `.gitignore`, `README.md`
- ADR-001 (stack split rationale)

Deferred to next session:
- Per-package manifests + scaffolded entry files
- Empty `agent` CLI binary that prints version
- CI workflow (`.github/workflows/ci.yml`)
- Settings loader scaffolding
- First green CI run on PR
