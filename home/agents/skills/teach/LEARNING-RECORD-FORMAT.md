# Preserving what changes the next lesson

Write a learning record when the user demonstrates non-trivial understanding, corrects a misconception, states prior knowledge, or confirms a mission change. Mere exposure to a lesson does not establish learning.

Create `learning-records/` with the first record. Scan existing numbers and increment the highest: `0001-<slug>.md`, `0002-<slug>.md`. A record needs only a title and one short paragraph:

```md
# A timeout leaves the remote outcome unknown

The learner explained why retrying a payment after a timeout can duplicate a charge and chose an idempotency key for the retry. Future lessons can build on the difference between request failure and confirmed remote failure.
```

Capture the insight and why it changes what to teach next. For “I already know Rust,” record the depth the user claims, such as having shipped a CLI, without presenting an unobserved skill as demonstrated. For a corrected misconception, identify the new distinction the user can apply.

Add evidence or implications only when a later teacher would need them. Optional status frontmatter can identify an active or superseded record. Avoid duplicating a terse definition already in `GLOSSARY.md`, or producing a session activity log instead of an insight.

When learning changes the mission, link to `../MISSION.md` and update that file after confirming the new goal. When later evidence contradicts an earlier record, keep the history and mark the earlier record `Status: superseded by LR-NNNN`, pointing to the replacing record. The next lesson should follow the corrected understanding.
