---
name: agent-browser
description: Use before the first browser action of a task to drive T3's preview tools, with the agent-browser CLI only as a named fallback, for UI flows, logins, rendered checks, screenshots, and recordings.
---

Drive the browser through T3's preview tools. Switch to `agent-browser` on PATH only when the session has no preview tools, the user asks for the CLI, a login must read its password from the keyring, or the preview still reports no automation host after the recovery below. Name that reason in your report. A failed step or a tab logged in as someone else is not a reason to switch: correct the step, or open a tab with another profile. Read the host's current tool capabilities rather than assuming that a closed tab means automation is unavailable.

Start desktop verification and capture at 1920×1080. Choose another viewport when the behavior requires it, and set it before recording. Keep one size throughout a clip; use separate clips to compare widths.

## Work in T3's shared browser

Call `preview_status` first. If no automation-capable tab is attached, call `preview_open`. When the user refers to an open page, inspect the listed tab instead of guessing its URL. Respect the tab's ownership: read a human-driven tab, or open your own to interact. The default profile carries the user's login; to sign in as another account, open your tab with the incognito profile that `preview_status` lists, and switch roles there by logging out and in.

Read the page with `preview_snapshot` before acting; request the image only when you need to see the layout. Target each element with `locator='aria-ref=<ref>'` from that snapshot. A CSS or text selector guessed from the source can match nothing or a hidden copy, such as the twin of a responsive field, and the action then waits out its whole timeout. Take a new snapshot after a navigation or a DOM change; refs die with them.

Send an action alone when the next one depends on its result, and read that result first. Calls sent together run one after another, so when the first misses, each later call still waits its full timeout. Two reads of unrelated panels can go together; clicking a button and typing into the dialog it opens cannot.

Pass `timeoutMs: 5000` to `preview_act` and at most `10000` to `preview_wait_for`; both default to 15000. A local page that has not rendered an element by then will not render it after a longer wait. Raise the limit only for a step known to be slow, such as a request to an external service. Wait only for what the current state will produce: if the snapshot shows the tab logged in, a sign-up form will never appear. Use `preview_wait_for` for a condition instead of a polling loop in `preview_evaluate`, which fails at 15 s.

After a timeout, inspect before retrying; never repeat the call with a longer timeout. Take a snapshot and act on what it shows:

- The element is missing, hidden, or covered: target a ref from the new snapshot, or close what covers it.
- A loader, blank area, or framework error stays after one `preview_navigate` reload: the app is failing. Investigate it through the project's verification skill instead of waiting.
- The call reports no automation host: call `preview_status`, reopen the tab with `preview_open` if it is gone, and repeat the step once. If the host is still missing, the CLI fallback applies.

For screenshots, `preview_snapshot({save: true})` returns `screenshotPath`. For video, start `preview_recording_start`, perform the flow, and stop with `preview_recording_stop` on the same tab; retain its returned `path`.

Follow the host's recovery rules for failed preview calls. A failure that different arguments would fix never justifies the CLI. The screenshot and recording paths are local evidence; use [pr's media procedure](../pr/SKILL.md#media) when an authorized PR needs them.

## Drive with the CLI

Use this section only under a fallback named at the top. Read `agent-browser --help` for supported commands and capture options. The daemon preserves browser state between invocations. A typical navigation and interaction uses:

```sh
agent-browser open <url>
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser fill @e1 "text"
agent-browser click @e2
agent-browser screenshot <path>
agent-browser get text @e1
```

For captures, `screenshot --full` includes the full page and `--annotate` labels elements; confirm supported options in help. The interactive snapshot returns handles such as `@e1`. Inspect again after navigation or a DOM change before trusting old handles. Drop `-i` when noninteractive text matters. A stable named control can be reached directly, for example `agent-browser find role button click --name Submit`. Use `get url` or `is visible @e1` when those observations answer the check. Commands can be chained with `&&` when each depends on the previous one succeeding.

## Select the account before submitting

Check this directory's local `auth.md` for the app's repo path, local URL, and environment table with email, login URL, and password source. It is a machine-specific notebook, never committed. After a successful first login to an app, create or extend its entry with those fields. Store only a seed-file or keyring reference, never the password. Select the environment and role that the task needs; an existing login for another account is not interchangeable.

For an unknown repo or a failed attempt, follow [login.md](login.md) before changing credentials, data, or database settings.

Staging passwords live in the OS keyring. Check presence without exposing the value:

```sh
secret-tool lookup service agent-browser env <env> >/dev/null 2>&1
```

Exit zero confirms a stored value. Read it inside the command consuming it so the transcript never receives it. This needs the CLI, because a preview tool would carry the value in its arguments:

```sh
agent-browser fill @e2 "$(secret-tool lookup service agent-browser env <env>)"
```

To store a missing value, the user can run `secret-tool store --label="agent-browser: <env>" service agent-browser env <env>`. Do not declare it missing before the presence check.

Open the environment's login URL, wait, inspect the form, fill its observed email and password controls, and submit. Inspect the post-login state: the expected dashboard or account navigation and route establish success. A submit click alone does not. Keep existing user logins when cleaning up this task's browser resources.
