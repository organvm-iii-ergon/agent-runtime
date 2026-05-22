# apps/bin

Native per-platform launcher: spins up the TS runtime, locates Python MCP adapter subprocess, loads optional Rust perf-tools native modules.

Current status: initial `agent` binary implemented with `--version` and `slash suggest` support for validating slash-command composition from the terminal. The `slash suggest` demo command loads OpenCode-style markdown commands from the current project and global config.
