# Notes verification map

This example shows the shape of a generated map for a fictional Notes app. Its commands are illustrative. A real map uses the commands, handles, and launch recipe observed in that repository.

Read this index before choosing a feature recipe. The map covers user paths, required state, stable handles, actions, and proof; implementation details belong in the source investigation.

## Start from a known instance

Launch Notes at `http://127.0.0.1:4173` with `NOTES_DATA_DIR=/tmp/notes-verify-$RUN_ID`. Put `control-notes` and `notes` on `PATH`. Doctor must report the expected URL, disposable directory, and build revision. Drive only the instance this verification run started.

Prepare `Quarterly plan` with body `Draft budget` and `Grocery list` as baseline notes. Seeding them enables search scenarios; it does not prove creation works. Start each recipe from this baseline unless its preconditions say otherwise, and restore it after mutations.

Choose `NOTES_EVIDENCE_DIR=/tmp/notes-evidence-$RUN_ID` outside the disposable data directory. Create feature subdirectories there before capture. Preserve them through the Launch recipe's teardown and check their files afterward.

## Capture the path that was exercised

Use `control-notes browser` for browser actions and `control-notes cli -- <command>` for terminal actions. Prefer accessible roles and names to CSS position. Keep quoted names and flags literal.

Retain the action transcript with feature ID and entry point. For browser proof, capture the relevant state with an ARIA snapshot and a screenshot showing the app identity. For CLI proof, retain command, stdout, stderr, and exit code. For a mutation, reopen the value through a read-only second view. A final screenshot alone does not show which action produced it.

When a path cannot be reached, record the attempted command and unmet prerequisite. Exercising another entry point does not make the skipped one pass. Restore fixture state using the launch/cleanup recipe, retaining proof artifacts.

## Write one recipe per feature

Each feature file begins with an H1 title and a paragraph describing user-visible behavior, then these four H2s in order:

1. `Sub-features`: short behavior IDs with one-line meanings.
2. `How to get to it (user POV)`: user entry points.
3. `Driving it with <harness>`: preconditions followed by labeled actions, exact commands, and observable results.
4. `Gotchas`: traps that invalidate or waste a run.

## Features

- [Create a note](create-note.md): browser and CLI creation, cancellation, and persistence.
- [Search notes](search.md): toolbar, keyboard, and CLI search, matches, empty results, and clearing.
