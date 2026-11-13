---
name: sol-loop
description: Review completed code changes or a pull request with Sol in a bounded loop, or use when the user says "sol loop" or "faz revisao com o sol".
---

# sol-loop

This is a T3 Code workflow for making your code changes more correct before
(or sometimes after) filing a pull request. Use OpenAI's GPT Sol to review
your code in a loop. Each round runs two Sol reviewers in parallel: the
correctness reviewer looks for bugs, regressions, and a design that invites
them, and the quality reviewer judges conventions, overengineering, and cost
that grows with volume.

Make the most minimal possible changes to appease the Sol reviewers. Be careful
of scope creep and don't be scared to push back.

Reviewers reply in English. Notes to the user during the loop and the final
report stay in the user's language.

## Budget

- Default: 3 rounds total. Round 1 is full and finds everything it can.
  Later rounds check only changed code and open findings.
- Extend to 5 only for security, permissions, auth, data loss, or
  state/concurrency, while a blocker or should stays open with evidence. Or when
  the user asks.
- Stop early if a round returns only nits or follow-ups. Declined nits,
  follow-ups, and comment, doc, or format-only fixes need no new round.
- A fix confined to test files needs no new round once the changed test
  fails without the production change and passes with it. Record it as
  `fixed, not re-reviewed`. A reviewer whose only open findings were fixed
  this way counts as approving.
- All loops on one PR share 6 rounds, and a loop after approval (step 5)
  gets at most 2 of them. At 6, stop reviewing and tell the user the count
  and which change no approval covers. More rounds need the user's
  go-ahead.
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

Call `orchestrator_capabilities`. Select GPT-6.1 Sol (`gpt-6.1-sol`) unless
the user named another version, and use the same model for both reviewers.
Each round, start both reviewers with `delegate_task`
(`role: "review"`, `mode: "async"`), one call per reviewer. On every call,
including retries and later rounds, explicitly set `target.options` to:

```json
{"reasoningEffort": "high", "serviceTier": "default"}
```

This selects high effort on the standard service tier, not Fast (priority).
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
Before the line-level review, question the design against the intent: is there an
approach that changes less or removes code, a mechanism the library or repo already
provides, logic placed in the wrong layer, or a state or ownership model that invites
bugs? Name the alternative and where it lives.
A separate reviewer judges conventions and overengineering. Skip style unless it
hides a bug. Other paths, rare cases, small perf, extra compat: nits.
blocker = intended case wrong. should = real bug callers will hit, in intent, or a
design whose alternative exists and the current one fails or costs more in a case
you show. nit = rest, including design preference.
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
Go through every changed file and apply each check below to it. Report every
finding, not only the main ones: later rounds do not reopen code that did not
change, so what you miss now stays.
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
Checked: <every changed file>
```

## 3. Answer findings

Check each finding and severity yourself. Another path, rare case, or
small cost is a nit, whatever label it came with. Check that `Checked:`
lists every changed file; ask the quality reviewer again for any it skipped.

- Agree: smallest fix. Prefer delete or narrow over new lock, cache,
  helper, or option. Fix the case that happened. Add one focused test
  that fails without the fix only if intent needs it.
- Disagree: say why, with evidence (file:line, test, output).
- Out of scope or nit: decline in one line. List as follow-up.
- Follow-up from a later round: fix it now when the fix is comment, doc,
  format, rename, or deletion only; otherwise list it. Either way it opens
  no round.

A design finding the author accepts can replace part of the change. Make
that rewrite before the line-level fixes it would discard.

When the two reviewers conflict, such as a guard that quality calls
unneeded and correctness calls required, decide by observed behavior and
record both ids with the evidence.

Update the ledger. Re-run checks and `git diff --shortstat <base>`. If
review grew the diff, cut first. Do not agree just to end the loop.

## 4. Next round

Start one only if budget remains and a blocker or should is open, behavior code
changed, or approval does not cover the current behavior diff. A test-only fix
recorded under Budget is none of these. Run both
reviewers, even one with no open ids, because a fix for one reviewer's finding
can create a finding for the other. Use a fresh `delegate_task` for each. Send each its round 1 brief,
the whole ledger (`fixed:` / `disagree:` / `declined:` / `follow-up:` + evidence), the same
base diff, and the change since last round.

Tell correctness: its open ids and changed code only, with no design
questions on code that did not change. Tell quality: read the whole base
diff for context, but raise new findings only on code changed since last
round and on leftovers a fix created, such as a wrapper or check no longer
needed. A new finding on unchanged code is labeled `follow-up` unless it is
a bug. Do not re-raise declined ids. Each marks its old ids `resolved` or
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
reviewers before the next push or merge, within the per-PR total under
Budget. Send each its round 1 brief, the
previous ledger, and the change since approval, scoped and worded as in step 4,
except that correctness questions the design of the change since approval,
then update the review line
to the total rounds. If the user asks to push or merge without that review,
remove `Sol verdict: approved` from the PR body and tell the user which
change the approval does not cover.

Report: rounds, model, what each reviewer changed, diff size before/after,
fixed, declined, and follow-up findings with reasons, usage if exposed
(else say not), pushed or not.
