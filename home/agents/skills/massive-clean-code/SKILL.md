---
name: massive-clean-code
description: Sweep a codebase for unreadable code and clean every finding without changing behavior.
disable-model-invocation: true
---

Find code that is harder to read than its behavior requires and clean it without changing behavior. Invoking this skill authorizes the cleanup and its PR; present no catalog and wait for no selection. Judge code against the project's `code-practices` skill, when it has one, and the project's own instructions; this skill owns the sweep, not the conventions.

Cover the path the user names, defaulting to the whole repository. Read the project's `AGENTS.md`, linter configuration, and existing lint plugins first, so findings exclude what a configured rule already rejects.

## Sweep for findings

Search in two ways, because each misses what the other finds:

- A structural scan with the project's linter, `ast-grep`, or `rg` for syntax such as nested ternaries, long `&&`/`||` chains, reassigned parameters, and `useEffect` calls that only set state.
- Reading by area with subagents, one area each with disjoint paths, such as API, front-end routes, and components with hooks. Reading finds what syntax cannot show: the same create and edit flow implemented twice, label, color, and tooltip decided in separate switches for one classification, or keys and values split into parallel arrays and rejoined by index.

A scan hit is a candidate, not a finding. Read each one in its file and drop the ones the code needs, such as an effect that synchronizes with something outside React. Merge occurrences of one pattern into a single finding that lists every location.

Classify each finding before changing it, because the class decides how to verify it:

- **Local:** the same inputs produce the same outputs at the same time.
- **Timing:** the code computes the same result at another moment. Removing derived state from a hook can deliver a value on the first render instead of after an effect. Check the affected screen in the real interface.
- **Ownership:** the change moves a rule between modules or changes an interface, such as merging two duplicated flows into one hook with modes. List each consumer and the behavior every mode must keep, such as different minimum lengths.

Skip a change that is only shorter or that splits code into functions to reduce line count. A cleanup must remove a decision, a duplicate, or bookkeeping the reader would otherwise track.

## Apply the findings

Work in an isolated worktree based on the main branch. Keep the cleanup in its own PR. Unrelated feature work stays out of it even when it touches the same files.

When areas are independent, split them among subagents with disjoint files. Keep the lint configuration and the final integration with the parent agent.

Put mechanical formatting in its own commit, apart from logic changes. Then a syntax-tree comparison can show that the formatting commit changed nothing else, and the logic diff stays small enough to review.

## Turn repeated patterns into lint rules

When a pattern is detectable from syntax alone, add a rule to the linter the project already runs, using its built-in rules or its plugin mechanism, such as a GritQL plugin in Biome. Use the project linter and skip separate scripts or hooks, so editor, commit, and CI run the same check.

Before adding a rule, probe it with valid and invalid cases, including parentheses, casts, and callbacks nested inside the expression being counted. Fix every occurrence the rule reports in the same PR.

Skip a rule that rewards artificial extraction. A cognitive-complexity limit, for example, measures nesting, not how readable a decision is, and agents meet it by moving branches into helpers.

Patterns that need judgment, such as duplicated flows and derived state, cannot become a rule. Include proposed wording for the project's `code-practices` skill or its `AGENTS.md` in the final report; changing those files needs the user's approval.

## Verify behavior before handing off

For each logic change, run the old and new versions on enumerated inputs with a throwaway script outside the repository, and compare their results. Run the project's typecheck, lint, cycle checks, and the tests covering the changed areas.

When a test fails, reproduce it on the base branch before calling it pre-existing. Report the reproduction with the result.

Review the final diff at a named commit SHA through [sol-loop](../sol-loop/SKILL.md). Follow its rules for reviewing later changes. Publish through [pr](../pr/SKILL.md). Merge only when the user authorizes it.

In the final report, group the changes by pattern with their locations, name the lint rules added, list the checks and their results, and state any finding left out with its reason.
