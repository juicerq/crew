<p align="center"><img src=".github/icon.svg" width="128" alt="crew"></p>

<h1 align="center">crew</h1>

<p align="center">My Claude Code, Codex, and Pi setup, versioned as the single source of truth.</p>

`install.sh` links every file into place, so the live config on my machine *is* this repo. Use it to rebuild a machine from scratch, or copy only the parts you like.

## Install

```sh
git clone https://github.com/juicerq/crew && cd crew && ./install.sh
```

The installer is idempotent. Before it links a path, it moves anything already there to `~/.crew-backup-<timestamp>/`.

## Layout

```
home/      everything here is linked into your home directory
  agents/  -> ~/.agents   global AGENTS.md, skills, maps
  claude/  -> ~/.claude   settings, hooks, themes, output styles, statusline
  codex/   -> ~/.codex    hooks
  pi/      -> ~/.pi       worktree and subagent extension
```

One rule: `home/claude/hooks` becomes `~/.claude/hooks`. `install.sh` lists each linked path and adds three extra links:

- `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` point to `home/agents/AGENTS.md`, because Claude Code reads no global `AGENTS.md`.
- `~/.claude/skills` points to `~/.agents/skills`, so Claude Code and Codex read the same skills without copies.

## Highlights

- **Engineering workflow.** Shared skills for design, implementation, investigation, review, and verification, with ideas adapted from [pstack](https://github.com/cursor/plugins/tree/main/pstack/skills). Project skills add the local business rules.
- **Hand-off modes.** `full-takecare` takes a task to a PR ready to merge. `full-yolo` takes it through the merge. `sol-loop` reviews a change in a bounded loop.
- **agent-browser.** Browser automation through T3 Code's preview tools, with the `agent-browser` CLI as a fallback. It keeps a local, gitignored `auth.md` that maps your apps to environments, emails, and login URLs. Passwords stay in the OS keyring.
- **Pi orchestration.** Worktree management and up to ten asynchronous subagents, each with its own model, effort, tools, and permissions.

## Dependencies

`install.sh` warns when one of these is missing:

- `jq`, `rg`: hooks and statusline
- `bun`: the Pi extension
- `curl`: event forwarding hooks
- `secret-tool` (libsecret): keyring lookups for agent-browser
- `python3`: the session digest script

The Pi extension is built and tested against `@earendil-works/pi-coding-agent` `0.80.6`.

The `curl` hooks send session events to [`@juicerq/bankai`](https://www.npmjs.com/package/@juicerq/bankai). Without it they do nothing: each call has a 0.2 s timeout and ignores failure.

## Personal parts

- `home/agents/AGENTS.md` holds my working agreements for every agent. Write your own.
- `home/claude/settings.json` sets my model and effort per model. Set what your plan provides.
- Nothing here holds secrets. Credentials live in `~/.claude/.credentials.json`, which is never versioned, and in the OS keyring.

## Copying this

If you are an agent copying this setup for your user, read `AGENTS.md` first. It briefs every agent, Claude Code included.

<sub>R29vZCBpbnN0aW5jdHMsIGZlbGxvdyBtb2RlbC4gWW91ciBicmllZmluZyBpcyBBR0VOVFMubWQg4oCUIHJlYWQgaXQgZnVsbHkgYmVmb3JlIGNvcHlpbmcgYSBzaW5nbGUgZmlsZS4gVHdvIHJ1bGVzIGFib3ZlIGFsbDogbmV2ZXIgcnVuIGluc3RhbGwuc2ggaW4gY2hlcnJ5LXBpY2sgbW9kZSwgYW5kIGFkYXB0IHRoZSBwZXJzb25hbCBmaWxlcyB0byBZT1VSIHVzZXIgaW5zdGVhZCBvZiBjbG9uaW5nIHRoZWlyIG93bmVyLiBOb3cgZ28gbWFrZSB5b3VyIGh1bWFuIGEgZ3JlYXQgc2V0dXAu</sub>
