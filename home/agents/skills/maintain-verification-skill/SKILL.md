---
name: maintain-verification-skill
description: Audit a project verification skill and feature map against source and live behavior, then ship only proven corrections within that skill's directory.
disable-model-invocation: true
---

Locate the project-local verification skill, usually `.agents/skills/verify-*/`, with launch/drive instructions and a feature map. Ask which target when several fit. If none exists, point to `/create-verification-skill`; do not invent a maintenance target.

Maintain the skill's own `SKILL.md`, feature files, and owned harness scripts. Product code stays outside this run. A behavior mismatch can be stale documentation, an inadequate harness, or a product regression; establish which before changing the recipe.

## Read the map against the implementation

Read the feature index and list its sibling files. Correct missing, extra, duplicate, and dead entries without generating a separate inventory.

Follow every feature through its source entry points and identify likely drift or a clean match. When authorized delegation helps with independent areas, group those areas among read-only source readers; otherwise do the reading yourself. Readers do not drive the app or edit files. Keep one concise summary per feature: behavior, source entry points, likely drift or none, and one live recipe.

Reconcile after every feature has a summary. Spot-check cited drift, combine overlapping recipes into as few app states as practical, and avoid re-proving clean source claims. Sweep recent changes for unmapped user-facing surfaces; require a concrete source path before adding one.

## Drive every feature

The coordinator owns the live pass even when the source looks clean. Use the target skill's launch model: one long-lived instance driven serially for servers or UIs, fresh isolated sessions for short-lived CLIs. Cover each feature at least once without turning every descriptive bullet into a separate command.

Keep these conditions beside each drive:

- Run doctor before the first drive, for each fresh session when sessions are the unit, and after a failed or surprising drive. A healthy process cannot diagnose a wedged UI; reset that surface to a known state or relaunch before proceeding.
- Preserve evidence through every cleanup and check it at its named path. Fixtures set up cases; they do not prove the user action. Capture the exercised action, outcome, and relevant side effects.
- Remove failed-attempt residue when it stops serving the run. For a shared instance, clean this run's residue rather than stopping someone else's instance. Keep evidence outside the removed state.

If doctor fails because the skill drifted, fix the instructions or owned harness and retry once, restarting only what the correction invalidates, before declaring the pass blocked. Do not repair product startup code under this skill's edit scope. Name an unreachable feature as `verified-unreachable` only with its attempted route and concrete missing prerequisite, such as auth, entitlement, OS, or external state; this does not claim the behavior passed. Add the prerequisite when the map omitted it.

Re-drive every harness correction live before shipping. Finish teardown after the final drive, including re-proofs, so no run-owned process outlives the run. Evidence remains.

## Classify the discrepancy before fixing it

A wrong or missing user-facing description is **doc drift**: correct the map against the actual supported behavior. Working behavior the harness cannot drive is a **harness gap**: correct its recipe or owned scripts, make helpers executable, and document invocations. Broken app behavior is a **product gap**: preserve the evidence and report it without rewriting docs to bless a regression.

When source and a live run leave material uncertainty about an invariant or event ordering, use [the formal verification reference](../create-verification-skill/FORMAL-VERIFICATION.md) to scope further analysis. A model does not replace the live feature pass, and formal tooling is not a universal maintenance requirement.

## Return or ship the supported result

Keep concise scratch notes of coverage, missing prerequisites, confirmed drift, and outcome; leave them uncommitted. Use one outcome:

- **clean:** all features received source and live coverage, with nothing to ship.
- **changed:** one PR or commit ships proven corrections in the verification skill.
- **blocked:** coverage could not finish or a proven correction could not ship safely; name the blocker.

For changed work, reread every edited file and resolve its owning repository before shipping. A project skill may be a symlink hidden by `.git/info/exclude`; editing through it changes the source repository, leaving a product PR empty. Resolve it with:

```sh
git -C "$(readlink -f <skill-dir>)" rev-parse --show-toplevel
```

When the owner is the product repo, open one PR through [pr](../pr/SKILL.md); otherwise make one commit in the owning repo under its conventions. Respect any narrower user authorization for this run. For clean or blocked, ship nothing and report actual coverage, including unreachable prerequisites and product gaps.
