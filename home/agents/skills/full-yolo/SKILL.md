---
name: full-yolo
description: The user says "full-yolo" to hand off a task through to a merged PR.
---

Take the user's task from its current state to a merged PR. Only an explicit "full-yolo" request grants the merge; any other handoff uses [full-takecare](../full-takecare/SKILL.md), which leaves the merge to the user. Installing or discussing the skill does not invoke it.

Follow [full-takecare](../full-takecare/SKILL.md) from the start through its readiness check, with the changes below. Its rules for scope, verification, Sol review, publication, review threads, watching, and questions still apply.

## Merge authorization

This request replaces full-takecare's merge prohibition for this task's PR only. Keep its rule against automatic merging until the merge gate passes, then merge the PR with the method the repository uses. Read the allowed methods and recent merged PRs to choose it. If the repository requires auto-merge or a merge queue, use it and stay until GitHub reports the PR as merged.

The request still does not authorize pushing to the default branch, merging another PR, or bypassing branch protection with `--admin` or any other override.

## CI blocked by billing

GitHub Actions fails a job without running it when the account's payment failed or its spending limit ran out. Such a job ends within seconds, runs no steps, and carries an annotation about payments or the spending limit. Confirm each one with `gh run view <run-id>` before treating it as a billing failure. A job that ran steps and failed is a real failure; fix it as full-takecare describes.

Do not rerun or wait for billing failures; fixing billing is outside this task. Replace each one with a local run on the final head:

- Read its workflow under `.github/workflows/` and run the same commands, such as install, typecheck, lint, test, and build, with the versions and environment the workflow sets where possible.
- Run them again after every later commit or rebase.
- Record each command and its result for the report. A step that needs secrets, services, or a platform unavailable here stays unverified; name it.

A passing local run counts as that check in the readiness check. If an unverified step covers behavior the diff changes, do not merge; ask the user. If it covers unrelated work, such as a deploy job, list it and continue.

When branch protection requires a billing-failed check and refuses the merge, leave the PR open and report it as blocked by billing.

## Merge and report

Merge when full-takecare's readiness requirements hold on the final head, with local runs replacing billing-failed checks. After merging, read the PR again to confirm its state and merge commit, then call `unwatch_pull_request` in T3 Code.

Report one verdict: **Merged**, or **Blocked** with the actual blocker and what is needed. Include the PR link, the merge commit or final head SHA, verification evidence, the billing-failed checks with the local commands and results that replaced them, unverified steps, the Sol outcome, and decisions made for the user.
