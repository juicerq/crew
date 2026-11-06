---
name: teach
description: Teach across sessions in a learning workspace with a mission, HTML lessons, practice evidence, and learning records. Use when the user wants continued study or the directory already contains MISSION.md or lessons.
argument-hint: "What would you like to learn about?"
---

Help the user make progress toward a real goal over several sessions. Keep the course in the current directory so the next session can build on what the user demonstrated.

## Find the next lesson

Read `MISSION.md`, `NOTES.md`, `RESOURCES.md`, `GLOSSARY.md`, and `learning-records/` when present. The mission explains why this topic matters; the records establish what the user can already do. If the mission is missing or too vague to choose a useful exercise, ask about the intended outcome using [MISSION-FORMAT.md](MISSION-FORMAT.md), then write it.

Choose one small target from the user's request or the next useful step toward the mission. Match the challenge to their demonstrated knowledge, stated prior experience, and practice history. When an earlier lesson exists, ask for its scoreboard if that evidence would affect the choice. Browser `localStorage` is not available from the workspace files: missing history is uncertainty about performance, not evidence of failure or mastery. Deliver a suitable lesson with that uncertainty explicit rather than waiting indefinitely for a paste.

Before teaching the target, find a high-trust source in `RESOURCES.md`; search for one and add it if none covers the target. Use [RESOURCES-FORMAT.md](RESOURCES-FORMAT.md) to preserve what each source is useful for.

## Build something the user can practice

Save each lesson as `lessons/0001-<dash-case-name>.html`, incrementing the highest existing lesson number. Teach one tightly scoped skill tied to the mission, with only the knowledge needed to attempt it. Keep it short enough for a quick, tangible win.

Start from the components in `assets/`. Create a shared stylesheet first; reuse it across the course. Put a new reusable quiz widget, simulator, or diagram helper there when another lesson could use it. Each lesson remains one HTML entry point, linking those local assets and other lessons or reference documents with working anchors.

Use readable typography, a clear layout, and citations beside claims. Recommend the strongest primary resource to read or watch, and remind the user they can ask the agent follow-up questions.

Explain new knowledge without needless difficulty. Then ask the user to retrieve or apply it, with immediate feedback where possible. Retrieval practice and spacing build retention; interleave related topics for skills practice. A correct answer immediately after an explanation shows current fluency, not yet long-term storage strength. Some missions, such as theoretical physics, need more knowledge; others, such as yoga, need more physical practice.

Every practice feedback loop keeps a scoreboard: store each attempt's score and exact missed items in `localStorage`, show the misses, and provide one click to copy the whole history. Build this once in `assets/` and connect each interactive lesson to it. For real-world steps such as poses, collect the performance the learner can actually report; do not invent observations. Quiz answer choices use the same word count and, where possible, character count so formatting does not disclose the answer.

Open the lesson with `xdg-open`. Check that the entry point, local assets, links, feedback, and scoreboard work. A saved file with broken practice controls has not delivered the intended lesson.

## Separate delivery from learning

There are three distinct outcomes:

- **Lesson delivered:** the HTML lesson is available and its practice works. Give the user the entry point and invite an attempt. This delivery can finish while their attempt is pending.
- **Awaiting an attempt:** ask for the copied scoreboard and what it misses: confusion, effort, or where the user stopped. Do not record unattempted material as learned.
- **Learning recorded:** after evidence arrives, write the non-obvious understanding it establishes in `learning-records/`, add terms the user can now use correctly to `GLOSSARY.md`, and preserve stated preferences in `NOTES.md`.

Use [LEARNING-RECORD-FORMAT.md](LEARNING-RECORD-FORMAT.md) and [GLOSSARY-FORMAT.md](GLOSSARY-FORMAT.md). The scoreboard is the performance record; interpret it alongside the user's explanation. A perfect first quiz does not establish delayed recall. A learner who explains a corrected misconception may establish an insight worth recording even after an imperfect score.

When the user's goal changes, confirm the new mission, update `MISSION.md`, and record why the change matters for future teaching. Keep the confirmed goal distinct from a possible new interest.

## Keep useful material between sessions

Create printable, quickly scannable HTML references in `reference/` for things the topic keeps reusing: syntax, algorithms, flowcharts, exercise routines, or pose sequences. These compress the lessons for later lookup; they do not substitute for practice evidence.

Use canonical glossary terms throughout lessons, references, and records. Record teaching preferences and working notes in `NOTES.md` without treating notes as proof of learning.

When a question needs practical judgment from experience, answer as far as the evidence supports and look for a reputable community where the user can test the skill: a well-moderated forum, local group, or class within their budget. Respect a preference not to join communities and preserve it in `RESOURCES.md`.
