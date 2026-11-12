---
name: pr
description: Prepare, create, or update an authorized pull request with a description grounded in the final change.
---

Write for a reviewer who has not followed the conversation. Ground claims, examples, and media in observed evidence. Read the final diff and relevant implementation, then explain the problem and resulting behavior in the repository's language. Rewrite an existing description around the current change when its scope changes.

Use the template below, translating headings and labels into the body's language. Keep **Why the change** and **Change outline**. Omit empty links and media sections. Verification belongs in CI or the handoff: the body has no validation section, test counts, commands, logs, environment setup, or review history. The one exception is the review line that [sol-loop](../sol-loop/SKILL.md) adds when it pushes.

## Description template

~~~
{Links to the issue, ticket, or plan, when available.}

## Why the change

{One sentence: the problem this PR solves and what becomes possible after it ships.}

## Change outline

### {Short change name}

{Name the affected area or flow. Explain the previous problem in one or two short sentences.}

{Show the important change through a compact view of behavior, contract, data structure, ownership, or flow.}

{A concrete example of the result, in one or two short sentences.}

> **How it works:** {Optional. Only the reason the change produces the result, when the view does not show it. Often one sentence.}

{Mention a migration, compatibility constraint, or limitation only when it affects understanding or merging.}

## Screenshots / video

{Relevant captured media with brief captions and accessible URLs. Omit this section when no relevant media exists.}
~~~

Repeat the change subsection for independently understandable changes. A small diff needs only a short context paragraph, the view, a short example, and at most one more sentence. Each block adds information; cut sentences that repeat the context, view, or example. Describe unchanged behavior only when a reviewer could reasonably suspect it changed.

Choose the view that makes the change visible. Use a `diff` fence for an existing shape, or show the complete shape when it is mostly new. Keep each before/after pair in its own block. For a deletion, context alone may suffice. For user or processing flows, show short previous and new paths, using product terms for interactions and key stages for processing.

Write examples in second person with short sentences and concrete amounts, dates, or times in bold. Use a blockquote starting with **Example:** or **Exemplo:**. For a bug, include what happens today before the fix.

Use **How it works:** or **Como funciona:** only when the view leaves the reason unexplained. Keep the entire explanation in one blockquote, prefixing every line and paragraph separator with `>`. For multiple stages, use short numbered steps naming who acts, what they decide or do, and what follows. Implementation names may locate a responsibility; they should not retell the change or the work history.

## Media

Use screenshots for static results and video for sequence, movement, or waiting. Use both only when each explains a separate point; omit them when there is no relevant visible result.

For web interfaces, capture each screenshot at two viewports by default: mobile at 390×844 and desktop at 1366×768. Drop a viewport when the change does not appear there or looks the same as in the other. Add one, such as 768×1024 or 1920×1080, when the layout changes at a breakpoint between them in a way that shows the change. Keep each before/after pair at the same viewport, and name the viewport in its caption.

Reuse captures of the final revision made earlier in the task. If captures are missing, use [agent-browser](../agent-browser/SKILL.md), which prefers product-native tools, against the changed checkout. Capture the relevant action and outcome, adding before/after views when they clarify the result. Inspect screenshots, play videos, and inspect converted files before attaching them.

Keep captures outside version control. Prefer short H.264 MP4 clips below 10 MB unless the repository's upload limit is confirmed.

### Attach to GitHub

Check `gh pr create --help` or `gh pr edit --help` for `--attach`. When supported:

1. Put each image in the draft body as `![caption](<media-path>)`.
2. Put each video as `![](<media-path>)` alone in a paragraph, with its caption above.
3. Use `--body-file <draft-path>` and one `--attach <media-path>` per file, matching the body paths.

The CLI uploads the files and replaces local references with hosted URLs; a standalone video reference becomes a player. If `--attach` is unavailable, use an available authenticated GitHub browser session. Publish only hosted media URLs and confirm that they render or open from the PR.

An upload failure may still have created or updated the PR. Read its state before retrying, retry only missing uploads, and retain relevant hosted URLs when replacing the body. Preserve local evidence and report any unresolved upload limit.

Reference: [GitHub CLI attachments](https://docs.github.com/en/github-cli/github-cli/attaching-files-with-github-cli).

## Publish and confirm

Prepare the title and description before publication. Commit, push, and create the PR only within the user's authorization; otherwise leave a local draft. Check for an existing PR before creation or retrying an uncertain operation.

In T3 Code, call `link_pull_request` immediately after starting work on an existing PR or creating one. Before handoff, call `list_thread_pull_requests` and register any missing PR from this work. Report a registration failure as a limitation.

Confirm the resulting PR, current description, and attachments. Return its URL, or the draft path, with anything that affects merging. Write that handoff in the user's language, whatever language the PR body uses. The description must explain the final behavior once, and the evidence it includes must be accessible. Before marking the PR ready or handing it off, review the final diff with [sol-loop](../sol-loop/SKILL.md) whenever it changes behavior: code, schemas, queries, tests, or configuration read at runtime. Skip the review only when the diff changes nothing but copy, comments, docs, formatting, or presentation, and say in the handoff that it was skipped and why. A presentation diff touches only styles, class names, and static markup; it changes no handler, state, condition, query, or data shown. A small diff or a simple fix is not a reason to skip. When the diff changes after Sol approved it, follow that skill's rules for changes after approval.
