---
name: full-takecare
description: The user hands off a task to be finished on your own, through to a PR ready for them to merge, or says "full-takecare" or "toma conta".
---

Take the user's task from its current state to an open PR ready for the user to merge, unless "When the task is an error" ends it without one. Do not stop to discuss the approach; ask only under the conditions in "Readiness and handoff". Installing or discussing the skill does not invoke it.

## Authorization and scope

An explicit request authorizes completing the change, running the checks and browser or runtime verification it needs, committing, pushing, creating or updating the PR, rebasing, fixing conflicts, and using `--force-with-lease` on this task's branch after a rebase. Follow project verification commands and fixtures. Add tests to the project's suite only when the user asks for them; temporary checks stay outside the repository.

Never merge, enable auto-merge, enter a merge queue, push to the default branch, bypass branch protection, or delegate those actions. This workflow ends with the merge left to the user.

Inspect the working tree first. Preserve unrelated changes and keep this task on its own branch. If the changes cannot be separated safely, ask for the missing decision. Before work on an existing PR, disable its auto-merge and remove it from any merge queue; report those changes. Check again before each push. If automatic merging cannot be prevented, stop and report the blocker.

## When the task is an error

When the user sends only an error, such as a message, stack trace, log line, or screenshot, without naming a change, the task is to find its cause. Investigate on your own with the project's error, log, and data tools, and reproduce the failure when you can. Do not ask what to do with it.

Open a PR only when a change in this repository removes the cause and is worth making. Count how often the error happens and whom it reaches before deciding. End without a PR when the error is expected behavior already shown clearly to the user, comes from an external service or the environment, is already fixed on the target branch or in an open PR. Then report the cause, the evidence that establishes it, why no change is worth making, and anything the user must do outside the repository.

## Complete and verify

Finish the user's goal with the smallest change that satisfies it. Verify every changed behavior with evidence observed in this session:

- For a bug, reproduce the original failure and repeat the same action after the fix.
- Run the repository checks covering the change, including the relevant CI checks when available.
- For UI or runtime behavior, run the app and exercise the changed flow. Inspect screenshots or recordings before using them as evidence.
- Use a temporary script outside the repository when it gives direct evidence without adding tests to the suite. Delete it when finished.

If the environment prevents a check, distinguish what passed from what remains unverified. Do not call the PR ready when proof is missing.

## Review and publish

When [pr](../pr/SKILL.md) requires a Sol review, use [sol-loop](../sol-loop/SKILL.md) on the final diff and resolve supported findings within its round budget. Follow its rules for later changes; an exhausted review budget is not approval.

Fetch the target branch and rebase onto its latest commit before publication. Recheck behavior changes and meaningful conflict fixes, and have Sol review them when its rules require it. If an existing PR targets a feature branch, preserve that target.

Use [pr](../pr/SKILL.md) to prepare the title and description, publish the PR, and confirm its state. Keep the description consistent with that skill's format. Keep verification evidence in the handoff or CI. In T3 Code, register the PR with `link_pull_request` and confirm registration through `list_thread_pull_requests` before handoff.

## Follow checks and reviews

Inspect checks, reviews, and unresolved threads on the current head. Verify findings against the source, fix real bugs within the task's scope, and rerun the relevant checks before pushing. Distinguish a failure caused by the change from a repository or infrastructure failure using observed evidence.

This request also authorizes replies to review feedback on this PR and resolution of addressed threads. Explain declined findings with a concise written reason grounded in code or observed behavior. Attribute agent-authored replies to the verified model or harness acting on the user's behalf. Resolve a thread only after its reply was posted successfully. Keep unrelated suggestions as follow-ups.

In T3 Code, handle existing events, then call `watch_pull_request` and end the turn while checks or reviews are pending, with one line naming what you wait on; evidence and findings go in the handoff. Resume on its notification. Use one watcher for the PR; delegated reviewers never watch it. A notification calls for a fresh readiness check. Call `unwatch_pull_request` before a final handoff or a question that needs the user's answer.

Outside T3 Code, use an available PR monitor. If none is available, `gh pr checks --watch` can wait for checks; inspect reviews again after it returns. If reviews remain pending and no monitor can resume the work, report that limitation and the pending state. Do not create a polling or sleep loop or treat pending work as approval.

## Readiness and handoff

Fetch the target branch and read the live PR again. Confirm its head and base match the work you verified. Readiness requires all of these on the final head:

- Evidence covers the final diff, including fixes made after review or rebase.
- Required checks passed and review bots finished; findings are fixed or dismissed with written reasons.
- Sol approved the current behavior diff, with no blocker or should finding open. A diff that changes no behavior needs no approval; the handoff says the review was skipped.
- No human review requests changes and no review thread remains unresolved.
- The branch is current with its target and GitHub reports it as mergeable.
- The PR is open, is not a draft, and has neither auto-merge nor merge queue enabled.

Check whether target commits landed after the checks ran; overlapping changes need fresh verification. If someone else merged or closed the PR, report its actual state.

Report one verdict: **Ready to merge**, **Waiting for required approval** when only human approval remains, or **Blocked** with the actual blocker and what is needed. Include the PR link, final head SHA, verification evidence, Sol outcome, remaining risks, and decisions made for the user. State whether the PR is still open and unmerged.

Ask only when a missing decision or access prevents progress, verification cannot establish readiness, or the next action exceeds this request, such as changing production, deleting data, closing a PR, or force-pushing another branch. Use an available question tool with the blocker, PR link, and recommended option. If an answer is required, wait for it; otherwise leave the PR open and explain the limitation.
