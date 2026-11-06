---
name: sol-loop
description: Review completed code changes or a pull request with Sol in a bounded loop, or use when the user says "sol loop" or "faz revisao com o sol".
---

# sol-loop

This is a T3 Code workflow for making your code changes more correct before
(or sometimes after) filing a pull request. Use OpenAI's GPT Sol to review
your code in a loop. Each round runs two Sol reviewers in parallel: the
correctness reviewer looks for bugs and regressions, and the quality reviewer
judges conventions, overengineering, and cost that grows with volume.

Make the most minimal possible changes to appease the Sol reviewers. Be careful
of scope creep and don't be scared to push back.

## Budget

- Default: 3 rounds total. Round 1 is full. Later rounds check only
  changed code and open findings.
- Extend to 5 only for security, permissions, auth, data loss, or
  state/concurrency, while a blocker or should stays open with evidence. Or when
  the user asks.
- Stop early if a round returns only nits. Declined nits and comment,
  doc, or format-only fixes need no new round.
- Two reviewers per round, correctness and quality. Neither may start
  subagents or more reviewers.
- Keep one ledger for both: id, reviewer, severity, outcome, usage if
  returned. Never guess it.

## 1. Scope

Run `git status --short`. Do not stash, discard, or include unrelated
changes. Limit review to the change paths if they separate cleanly.
Otherwise stop and ask.

Find the base after `git fetch origin`:

- PR: `gh pr view <n> --json baseRefName,headRefOid`. Check out the branch
  only if clean. Confirm `HEAD` is the PR head, or ahead only by this
  change. Base: `git merge-base HEAD origin/<baseRefName>`.
- Local: `git merge-base HEAD origin/<default-branch>`. No remote: a base
  the user names, or `HEAD` for uncommitted changes only.

The change is base to working tree in those paths, with untracked files.
Use one diff command all rounds. State intent and out-of-scope in 1-2
sentences. Run covering checks. Do not send code this change breaks. Note
missing or pre-failing checks in the brief.

## 2. Start Sol

Call `orchestrator_capabilities`. Pick the latest Sol unless the user
named a version, and use the same model for both reviewers. Do not hardcode
an ID. Each round, start both reviewers with `delegate_task`
(`role: "review"`, `mode: "async"`), one call per reviewer. On every call,
including retries and later rounds, explicitly set `target.options` to:

```json
{"reasoningEffort": "xhigh", "serviceTier": "default"}
```

This selects xhigh effort on the standard service tier, not Fast (priority).
Do not rely on parent settings or model defaults. Record provider, model,
and requested settings; record effective settings only if exposed.
Save each `taskId`. New `clientRequestId` per call.
`childThreadId` is storage, not the next target. Do not use
`t3_thread_send`, `create_threads`, or `t3_thread_launch` for review.

If T3 tools are not listed, try one direct capability call. If no route
runs Sol with both settings, report the blocker. Do not substitute a model
or silently change the effort or service tier.

Do not edit scoped files while review runs. Wait for both notices. Do not
poll or start reviewers beyond the two. Each turn you end to wait is a
message the user skips: write one line with the round, a few words on what
you fixed, and the reviewers you wait on. Findings, fixes, checks, and
commits go only in the final report. Timeout, error, or no reply is not
approval. When one reviewer fails, cancel it, verify it stopped, and restart
only that reviewer with the ledger.

Round 1 briefs (T3 children get no history). Resolve
the repo's `.agents/skills/code-practices/SKILL.md`, when it exists, to an
absolute path for the quality brief. Both briefs start with the same header:

```
Review only. Do not edit, commit, push, comment on PRs, or start subagents.
Repo: <abs path> Base: <sha> Intent: <intent> Out of scope: <scope> Checks: <results>
See: git diff <base> [-- <paths>]; git status --short (read untracked).
```

Correctness brief, after the header:

```
Read surrounding code. Find bugs, regressions, broken callers, mismatch with intent.
A separate reviewer judges conventions and overengineering. Skip style unless it
hides a bug. Other paths, rare cases, small perf, extra compat: nits.
blocker = intended case wrong. should = real bug callers will hit, in intent. nit = rest.
Report problems, not fixes. The author decides what to change.
Reply:
VERDICT: APPROVE or CHANGES
C1 [blocker|should|nit] <file>:<line> <problem>. Evidence: <input or path that fails, and what happens> (stable ids)
```

Quality brief, after the header:

```
Judge how the code is written. A separate reviewer hunts bugs; name one you
notice in a single line and move on.
Read and apply <abs path to the repo's code-practices/SKILL.md>, when it exists, and the repo's AGENTS.md.
Search the repo for helpers, types, or modules the change reimplements.
Flag code, tests, or guards the intent does not need, such as an abstraction
with one use or an option no caller passes. Flag leftovers: unused exports, names a rename left
behind, debug logs, commented-out code. Flag where the same behavior fits in
fewer files or lines, and where the change departs from the naming and idiom
of surrounding code. When nearby code works around something the library does
natively, flag the native API; copying nearby code is not a reason.
For each new function, branch, and check, state what is already guaranteed at
that point. Flag code that handles a case those guarantees rule out, and a
rule checked in more than one place.
Flag cost that grows with volume: a query or request inside a loop, serial
awaits on independent work, the same fetch twice, loading everything to filter
in memory, quadratic work on a growing list. Smaller costs are nits.
Skip formatting the linter owns.
should = breaks a rule in those files, adds code the intent does not need, or
adds cost that grows with volume on a path that sees real volume. nit = rest,
including preference.
Report problems, not fixes. The author decides what to change.
Reply:
VERDICT: APPROVE or CHANGES
Q1 [should|nit] <file>:<line> <problem>. Evidence: <what already exists, what is guaranteed, or what it costs> (stable ids)
```

## 3. Answer findings

Check each finding and severity yourself. Another path, rare case, or
small cost is a nit, whatever label it came with.

- Agree: smallest fix. Prefer delete or narrow over new lock, cache,
  helper, or option. Fix the case that happened. Add one focused test
  that fails without the fix only if intent needs it.
- Disagree: say why, with evidence (file:line, test, output).
- Out of scope or nit: decline in one line. List as follow-up.

When the two reviewers conflict, such as a guard that quality calls
unneeded and correctness calls required, decide by observed behavior and
record both ids with the evidence.

Update the ledger. Re-run checks and `git diff --shortstat <base>`. If
review grew the diff, cut first. Do not agree just to end the loop.

## 4. Next round

Start one only if budget remains and a blocker or should is open, behavior code
changed, or approval does not cover the current behavior diff. Run both
reviewers, even one with no open ids, because a fix for one reviewer's finding
can create a finding for the other. Use a fresh `delegate_task` for each. Send each its round 1 brief,
the whole ledger (`fixed:` / `disagree:` / `declined:` + evidence), the same
base diff, and the change since last round. Tell correctness: its open ids
and changed code only. Tell quality: review the whole base diff fresh, because
a fix can leave a wrapper or check that is no longer needed, and do not
re-raise declined ids. Each marks its old ids `resolved` or
`still open: <reason>`.

Keep later briefs neutral. Send the diff and ledger, not your case for the
change. When a change relies on a guarantee, write "The author claims <X>;
verify it." Never ask a reviewer to confirm its approval.

## 5. Stop and ship

Agreed: both reviewers APPROVE the current behavior diff, no blocker or
should is open, and you have no concern of your own. Stuck: an item stays
disputed after two replies, or budget ends. Show both sides in 2-3 lines
each. The user decides. Budget end is not approval.

Do not push during the loop. Push after agreement only if the user asked
to push, ship, or update the PR. If you push to a PR, add above the model
blurb:

`Reviewed with sol-loop: <N> rounds with <model>. Sol verdict: approved`.

Add `on <effort>` only if verified.

The approval covers only the diff Sol reviewed. When behavior code changes
after the loop ends, such as a follow-up request, a fix after approval, or a
rebase conflict, review the change since approval in a new loop with both
reviewers before the next push or merge. Send each its round 1 brief, the
previous ledger, and the change since approval, scoped and worded as in step 4,
then update the review line
to the total rounds. If the user asks to push or merge without that review,
remove `Sol verdict: approved` from the PR body and tell the user which
change the approval does not cover.

Report: rounds, model, what each reviewer changed, diff size before/after,
fixed and declined findings with reasons, usage if exposed (else say not),
pushed or not.
