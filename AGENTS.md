# crew

`install.sh` links each path under `home/` to the same path in the home directory with a leading dot: `home/claude/hooks` becomes `~/.claude/hooks`. An edit here reaches the next session, so treat every change as shipped.

- `home/agents/AGENTS.md` is the one global instructions file. `install.sh` links it as `~/.codex/AGENTS.md`, `~/.agents/AGENTS.md`, and `~/.claude/CLAUDE.md`, because Claude Code reads no global `AGENTS.md`. Write only what holds for both Claude Code and Codex.
- For skill metadata, invocation policy, and registration, follow [Skill mechanics](home/agents/skills/writing-for-agents/SKILL-MECHANICS.md).
- Keep project instructions in `AGENTS.md` only. Claude Code ignores `AGENTS.md` whenever a `CLAUDE.md` sits in the same directory or above it.
- When the user wants this setup copied for someone else, follow "Copying this setup" below.

## Commit versions

Use `<major>.<minor>.<patch>: <subject>` for commits to `main`, following Semantic Versioning without leading zeros. Continue from the latest versioned commit on `main`; read an older `<major>.<minor>` version as `<major>.<minor>.0`.

For small changes, increment the patch version: `1.7.1`, `1.7.2`, and so on. For new behavior, increment the minor version and reset the patch: `1.8.0`. For large changes, increment the major version and reset the rest: `2.0.0`.

## Copying this setup

You are probably here because your user said "copy this setup for me". Read this before touching anything: this repo is **someone else's** live config, and parts of it are personal. Blind copying gives your user another person's preferences.

### Two modes — ask your user which one they want

**Adopt** (rare): your user wants this exact repo as their own symlinked source of truth. Have them fork it first (they'll want to push their own changes), clone the fork, run `./install.sh`. It backs up anything real at the target paths to `~/.crew-backup-<timestamp>/` before linking, and it is idempotent. Then walk them through the "personal" list below and commit their adaptations to the fork.

**Cherry-pick** (default): your user wants some of this in their existing setup. Do NOT run `install.sh` — it symlinks everything, replacing their config wholesale. Copy files individually into `~/.claude/`, `~/.codex/`, or `~/.agents/skills/` as appropriate.

### What is portable as-is

- `home/agents/skills/` — the main value here. Each directory is self-contained; copy the ones your user wants. If their `settings.json` has `"disableBundledSkills": true` or uses `skillOverrides`, register each copied skill there too.
- `home/claude/hooks/file_suggestion.sh`, `home/claude/scripts/`, `home/claude/themes/`, `home/claude/output-styles/`, `home/claude/statusline-command.sh`.
- `home/codex/hooks.json` and `home/codex/hooks/` when the user wants Bankai forwarding.
- `home/pi/agent/extensions/agent/` when the user wants persistent worktrees and controlled asynchronous subagents in Pi. Install its dependencies with `bun install` before linking it into `~/.pi/agent/extensions/`.
- `install.sh` as a reference for the symlink pattern.

### What is personal — adapt, never copy verbatim

- `home/agents/AGENTS.md` — the owner's global instructions, shared by Claude Code and Codex: conversation style, tests, comments, commits, and shell. Rewrite it for your user; at most keep the structure.
- `home/claude/settings.json`, if taken wholesale:
  - `"model"` assumes the owner's plan — set what your user's plan provides.
  - The four `curl` hooks POSTing to `127.0.0.1:47820` feed [`@juicerq/bankai`](https://www.npmjs.com/package/@juicerq/bankai), the owner's session-monitoring TUI. Harmless no-ops without it; delete them if your user won't run bankai.
  - `skillOverrides` must match the skills your user actually has.

### Post-copy checks

- `home/agents/skills/agent-browser` maintains a local `auth.md` in its own directory (machine-specific logins, no passwords). It starts absent and gets built during use — never commit it.
- Dependencies are checked (not installed) by `install.sh`: `jq`, `rg`, `curl`, `bun`, `secret-tool`, `python3`. Warn your user about missing ones.
- Verify: start fresh Claude Code and Codex sessions and confirm the copied skills appear in each available-skills list.
