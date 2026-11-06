---
name: improve-codebase-architecture
description: Find deepening opportunities in a codebase, compare them in an HTML report, and design the selected boundary.
disable-model-invocation: true
---

Find refactors that gather a scattered responsibility behind a smaller interface. Use the project's `code-practices` skill, when it has one, for depth and the deletion test, and use the project's product vocabulary to name the responsibilities. The result is a set of candidates and an interface design for the user's choice, rather than an automatic implementation.

## Find the friction worth changing

Take the user's named module, subsystem, or pain point as the search scope. Without that direction, begin with recent change hot spots: deepening pays off where future changes are likely. This command shows the thirty most frequently changed paths over six months:

```bash
bash -o pipefail -c 'git log --since=6.months --name-only --format= | sed "/^$/d" | sort | uniq -c | sort -rn | sed -n "1,30p"'
```

If changes are scattered, widen the search. Use history to choose where to read, not as proof of an architectural problem.

Follow a real concept through its callers. Look for places where understanding it requires visiting many small modules, where tightly coupled behavior leaks across seams, or where interface knowledge nearly equals implementation complexity. Apply the deletion test to suspected shallow modules.

Include verification friction in the assessment: a pure helper extracted for tests may leave the actual bug in its calling sequence, and an important path may be hard to exercise through its current interface. Identify the responsibility that would become local instead of treating every small file or missing test as a refactor candidate. Aim for testability and navigation that let both maintainers and agents follow the behavior.

## Show candidates before designing one

Read [HTML-REPORT.md](HTML-REPORT.md) to build the report. Each candidate needs concrete files, a before/after diagram, and a claim about which caller knowledge the deepened module absorbs. End with a top recommendation. Use the project's product names, such as “Order intake,” rather than introducing generic architecture names.

When T3 Code exposes `html_preview`, pass the complete document in `html`. Inspect the screenshot and console at desktop and mobile widths, fixing unreadable diagrams, clipped paths, and horizontal scrolling before previewing again. Publish the verified document with `html_render`, supplying `html`, a short `title`, and `height` from the preview's `contentHeight`, capped at 2000. In another host, use its available HTML preview or save the document outside the product checkout and inspect it through [agent-browser](../agent-browser/SKILL.md). Return the inspected artifact when inline publication is unavailable.

Stop at candidates here. Ask which one the user wants to explore, in their language. When the report is visible inline, do not repeat it or announce a file path. A recommendation does not select a candidate on the user's behalf.

## Design the selected boundary

After the user chooses, follow the project's `code-practices` skill, when it has one, to work out the caller, interface, owners, dependencies, and relevant cases. Identify the existing behavior and checks the proposed boundary must preserve. Resolve unclear product concepts with [domain-modeling](../domain-modeling/SKILL.md).

Finish when the selected candidate has a concrete interface design and verification approach. Applying the refactor remains a separate implementation request.
