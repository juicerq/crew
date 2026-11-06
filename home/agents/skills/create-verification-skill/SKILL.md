---
name: create-verification-skill
description: Create a project-local skill and feature map for driving the real app and preserving observable evidence when the user requests one.
disable-model-invocation: true
---

Build `.agents/skills/verify-<app>/` from the repository's actual launch and interaction paths. Its next reader may know nothing about the app: the instructions must let that agent start an isolated instance, exercise user behavior, recognize the result, and keep evidence after teardown.

Preserve the project's skill location convention. For a shared Claude/Codex project, use `.agents/skills/` as source and add a matching `.claude/skills/verify-<app>` symlink when that path is free. Do not replace a real directory. For browser work, use [agent-browser](../agent-browser/SKILL.md), including its preference for host-native automation.

## Discover a runnable path

Read the repo before asking for facts it contains. Find the user surfaces, documented startup command, ports, environment, seed requirements, and authentication. A repository may expose UI, CLI/TUI, service, desktop, mobile, or library surfaces; identify the primary one and note the others.

Inspect existing automation first: browser specs, PTY helpers, expect scripts, HTTP endpoints, or debug ports. Prefer those handles over a new generic harness. If none fits, use browser/CDP for web or Electron, tmux/PTY for CLI/TUI, or plain HTTP for a service. Establish which screenshots, transcripts, responses, exit codes, logs, or stored state can show the outcome. Check whether ports, data directories, and profiles let two instances run side by side; describe a shared-instance limit rather than driving the user's session accidentally.

Try the startup path before writing it as a recipe. Repair a startup blocker when the requested scope covers that repair; otherwise report its cause and keep the skill a draft until its path can run. Do not expand the task into unrelated product repairs. An irrelevant absent asset, such as an unused static directory or sample config, may be created as named verification scaffolding and removed during cleanup.

## Write the operating instructions

Give `SKILL.md` YAML `name: verify-<app>` and a description naming the app, surface, and triggering task. Ground these sections in observed commands and handles; leave no placeholders:

- **Launch:** exact startup and readiness observation, plus teardown. For short-lived CLI/TUI programs, build or prepare once and start each drive in a fresh isolated PTY or tmux session rather than inventing a long-lived server.
- **Doctor:** a read-only check of whether this instance is worth driving: expected build, owned process or port, configuration, and authentication as appropriate. Use it first when the instance behaves unexpectedly.
- **Drive:** real selectors or commands, preferring accessible names, data attributes, prompt strings, or routes over coordinates and tab order.
- **Evidence:** capture location and the observations that prove action, result, and side effects. Keep that location outside scratch state removed by cleanup.
- **Cleanup:** stop only instances this run started and remove their scratch state. Use owned PIDs or session identities, never a process-name kill. Preserve proof artifacts.
- **Helpers:** executable scripts, each with its invocation documented in the body.

Make evidence distinguish setup from behavior. Seeding a saved note proves the fixture exists; creating it through the app and reopening it proves that entry point. Capture the action and resulting state, then inspect relevant side effects such as written files, inserted rows, or sent messages. Avoid internal setters and test-only endpoints as substitutes for the user path. Mock only where an existing production boundary isolates an external system.

For a dry-run or test mode, observe what it actually skips in files, network, and git refs; its name alone is insufficient. For material uncertainty about invariants or interleavings, consult [FORMAL-VERIFICATION.md](FORMAL-VERIFICATION.md) to choose a bounded check. That is an option for the property at issue, not a dependency for every generated skill. Keep any generated reference resolvable in its destination.

## Map the features the next agent must reach

Create `features/README.md` and one file per identified user-facing feature, starting with the top three to five from routes, commands, menus, or docs. Use [the feature-map example](references/feature-map-example/README.md) for the shape. Its Notes commands illustrate a format; discover the target app's real commands rather than copying them.

Each feature explains its behavior, entry points, harness actions, and observable result. Keep these four H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>`, and `Gotchas`. Make prerequisites and resets explicit enough to reproduce the scenario. The map is the maintained verification source: exercising a convenient entry point does not establish other listed paths.

## Execute what you wrote

Run the generated instructions end to end: launch, doctor, drive one mapped feature, capture evidence, and clean up. One feature is enough for generation; the map lets future tasks cover more. After cleanup, check that the named proof artifacts still exist. Run cleanup after failed attempts too so iterations do not strand processes or ports.

Correct failed instructions and rerun the affected path. If launch or proof remains unavailable, deliver a draft with that gap rather than claiming the skill was proven. Point to `/maintain-verification-skill` for future upkeep; suggest a recurring cadence only when asked.
