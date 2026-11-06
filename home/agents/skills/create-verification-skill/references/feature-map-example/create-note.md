# Create a note

A user can open a draft from the toolbar or keyboard, save a titled note, or cancel the draft. The CLI creates the same note shape. Reopening a saved note establishes that the submitted values persisted.

## Sub-features

- `create-open`: reach a blank editor through each browser entry point.
- `create-save`: persist a title and body.
- `create-cancel`: discard a browser draft.
- `create-cli`: create the note from a terminal.

## How to get to it (user POV)

- Choose `New note` in the browser toolbar.
- Press `n` when focus is outside an editable field.
- Run `notes create --title <title> --body <body>`.

## Driving it with control-notes

Preconditions: doctor reports Notes at `http://127.0.0.1:4173`, the expected build, and this run's disposable data directory. No note has the title `Release checklist`, `Discard me`, or `CLI note`. Create `$NOTES_EVIDENCE_DIR/create-note` as described in the index and retain the action transcript with the entry point used.

- **Toolbar editor.** Run `control-notes browser click --role button --name "New note"`. The `Note editor` form appears with focus in `Title`. Capture this action's form with `control-notes browser snapshot --aria --path "$NOTES_EVIDENCE_DIR/create-note/open.aria.txt"`.
- **Save.** Run `control-notes browser fill --role textbox --name "Title" --value "Release checklist"` and `control-notes browser fill --role textbox --name "Body" --value "Tag and publish"`. The `Save note` button enables. Run `control-notes browser click --role button --name "Save note"`; the `Note saved` status and `Release checklist` heading appear.
- **Reopen the stored result.** Run `control-notes browser click --role link --name "All notes"`, then `control-notes browser click --role link --name "Release checklist"`. Confirm both saved values. Capture `control-notes browser snapshot --aria --path "$NOTES_EVIDENCE_DIR/create-note/saved.aria.txt"` and `control-notes browser screenshot --path "$NOTES_EVIDENCE_DIR/create-note/saved.png"`.
- **Keyboard editor and cancellation.** Return with `control-notes browser click --role link --name "All notes"`, focus the page outside editable controls, and run `control-notes browser press --key "n"`. Confirm the same blank editor. Run `control-notes browser fill --role textbox --name "Title" --value "Discard me"`, then `control-notes browser click --role button --name "Cancel"`. The list returns without a `Discard me` link. This exercises the keyboard entry; the toolbar proof alone would not cover it.
- **CLI creation.** Run `control-notes cli -- notes create --title "CLI note" --body "Created from terminal" --format json`. Retain command, stdout, stderr, and exit code. Require exit `0` and a new note ID with title `CLI note`.
- **CLI persistence through the browser.** Open `CLI note` from `All notes` and confirm its body. Capture the editor as `cli-saved.aria.txt` and `cli-saved.png` with the same snapshot and screenshot commands in this feature's evidence directory. Return to `All notes` and capture the list as `list.aria.txt` and `list.png`, showing both saved notes.

## Gotchas

Pressing `n` in a textbox types a character. Establish focus before treating it as a shortcut check. Titles are trimmed; assert the rendered title rather than the draft input.

A save notification or seeded note alone does not prove this action persisted its values. Reopen the actual note created by the drive. Remove `Release checklist` and `CLI note` through fixture cleanup and confirm `Discard me` was never saved. Keep the action transcript, snapshots, and screenshots after teardown.
