# Search notes

A user can find notes by title or body, open a match, and clear the query. A completed empty result must be distinguishable from a search that never completed. CLI search reaches the same notes without changing their content.

## Sub-features

- `search-open`: open from toolbar or keyboard.
- `search-match`: find title and body matches.
- `search-open-result`: reach a matching note's editor.
- `search-empty`: finish a query with no matches.
- `search-clear`: restore recent notes after clearing the query.
- `search-cli`: search from the terminal.

## How to get to it (user POV)

- Choose `Search` in the browser toolbar.
- Press `/` outside editable fields.
- Run `notes search <query>`.

## Driving it with control-notes

Preconditions: doctor reports the expected Notes URL, build, and disposable data directory. Baseline data includes `Quarterly plan` with body `Draft budget` and `Grocery list`. Create `$NOTES_EVIDENCE_DIR/search` and retain an action transcript identifying each entry point. The fixture establishes expected content; the query actions below prove search.

- **Toolbar entry.** Run `control-notes browser click --role button --name "Search"`. The `Search notes` dialog opens with focus in its searchbox.
- **Keyboard entry.** Close the dialog through its observed control, focus the page outside editable controls, and run `control-notes browser press --key "/"`. The dialog opens without inserting a slash.
- **Title match.** Run `control-notes browser fill --role searchbox --name "Search notes" --value "quarterly"`. Wait for `Search results` to contain `Quarterly plan` and exclude `Grocery list`. Capture `control-notes browser snapshot --aria --path "$NOTES_EVIDENCE_DIR/search/title.aria.txt"` and `control-notes browser screenshot --path "$NOTES_EVIDENCE_DIR/search/title.png"` with the query and app identity visible.
- **Body match.** Run `control-notes browser fill --role searchbox --name "Search notes" --value "budget"`. The same note remains with a body-match excerpt. Capture this state as `body.aria.txt` and `body.png` with the same commands.
- **Open match.** Run `control-notes browser click --role link --name "Quarterly plan"`. The dialog closes, the heading reads `Quarterly plan`, and the stored body still reads `Draft budget`.
- **No matches.** Reopen with the toolbar action and run `control-notes browser fill --role searchbox --name "Search notes" --value "volcano"`. Wait for the completed `No matching notes` status. Capture it as `empty.aria.txt` and `empty.png`.
- **Clear.** Run `control-notes browser click --role button --name "Clear search"`. The searchbox empties and `Recent notes` replaces the results list.
- **CLI match and miss.** Run `control-notes cli -- notes search "quarterly" --format json`, then `control-notes cli -- notes search "volcano" --format json`. Retain each command, stdout, stderr, and exit code. Both exit `0`; the first contains one object titled `Quarterly plan`, and the second is `[]`.

## Gotchas

The shortcut inserts text when an editor or searchbox has focus. Search is debounced; wait for results or a completed empty status rather than a fixed sleep. Archived notes are excluded unless `Include archived` is enabled.

Opening a result changes browser state, so reopen search before another query. CLI output defaults to human-readable text; use `--format json` for stable inspection. Keep query and outcome captures after cleanup; baseline notes alone are not search evidence.
