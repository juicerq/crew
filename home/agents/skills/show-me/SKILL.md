---
name: show-me
description: Show the current topic visually, or guide the user through completed changes in an HTML report.
disable-model-invocation: true
---

Show the topic the user named, or the last message's topic when no argument was given. Start with the view that makes the point clear and keep surrounding prose brief.

## Choose the view for the question

Use pseudocode for a decision or algorithm, a call tree for runtime order, a component tree for UI ownership, and a shallow file tree for responsibilities. Put labels beside the relevant nodes; omit calls, props, and files that do not help answer the question.

For example, an unchanged save can return its cached result:

```text
on(save)
  if content is unchanged
    return cached result
  write new content
  return fresh result
```

A call tree can show why subscription starts after navigation:

```text
submitForm
  createSession
    persistPrompt
    launchAgent
  navigateToSession
    subscribeToEvents
```

For a UI question, show components and the state or module boundaries that matter:

```text
SessionPage (apps/example/src/routes/session.tsx)
  useSessionEvents()
  SessionToolbar
    RunSkillButton (packages/ui)
```

A file tree can name responsibilities without code comments:

```text
src/
├── commands/ (parses user actions)
├── sessions/ (owns session state)
└── transport/ (sends API requests)
```

When the surrounding shape already exists, use a diff to locate the change. The same format works for component trees, file layouts, call trees, and control flow:

```diff
 on(save)
-  write content
+  if content is unchanged
+    return cached result
+  write new content
+  invalidate cache
```

Show the full block when most of it is new, omitted context would hide order or ownership, or the user needs a copyable target. Use more than one view only when each explains a different necessary point. Preserve conditions and uncertainty: a clean diagram must not turn a proposed flow into observed behavior.

## Deliver a visual artifact when it helps

For a UI, layout, state comparison, or concept too dense for a small diagram, make one focused HTML diagram, infographic, or short slide deck. Use real labels and available data, match the product's visual language, and support desktop and mobile. Place each view beside the short explanation it supports.

Prefer the host's visual creation, preview, and publishing capabilities when available. Otherwise save the HTML outside the product checkout to `${TMPDIR:-/tmp}/show-me-<topic>.html` and open it:

```bash
xdg-open "${TMPDIR:-/tmp}/show-me-<topic>.html"
```

Check the rendered result and its links or interactions before handing it over. If the host cannot open or render it, provide the artifact path and state that limit.

## When the user asks for a report

Build one focused HTML journey through the completed work for someone who did not follow the implementation. Group it by the context the user needs: what changed, why, and how it works are useful starting points, not required headings. Use a practical before/after scenario wherever it explains the difference.

This report is the final presentation of the work. Explain the completed result and its established limits; the report request does not start another review or implementation cycle. Prefer host delivery when available, otherwise use the temporary HTML path above.
