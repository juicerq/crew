---
name: show-options
description: The user asks to be shown options before choosing, such as "me mostra opções", "mostra 3 opções", or "hoje vs opções", usually in the chat with an HTML preview, screenshots, or video.
---

Show the options for the decision the user named, in the chat, so they can choose by looking. The request covers building and showing the options, not applying one: production behavior stays as it was until the user picks.

When the options are text read as text, such as a name or an approach, list them in the reply without a page. Text that appears in an interface is shown in place, inside the screen that holds it.

## Decide what to show

Read the current screen, scene, or component before drawing anything, and follow [frontend-design](../frontend-design/SKILL.md) for interface options.

- Follow the requested count; show three when none was given.
- Make each option one you would ship, and make the options differ in idea: another structure, hierarchy, or mechanism. The same card in a second color is not an option. In a refinement round, such as "outras opções do 4", narrow variations are the request. When fewer options hold up than the count asked for, show those and say so.
- When something exists today, show it as the first block, labeled as the current state.
- Label each option with a key and a short name, such as `A. Selo no cabeçalho`. A label never changes in the thread, because the user answers with it: "estou entre 3 e 4A". A later round shows the options the user still considers under the same labels beside the new ones, and variations of 4 become 4A and 4B.
- Capture or draw every option with the same data, scene, viewport, zoom, and state, so the option is the only difference between two blocks.

## Choose the medium

A medium the user names wins. Otherwise choose by what settles the decision:

- **HTML mockup** when the design does not exist yet and its static look settles it. Draw it with the product's own colors, type, components, real labels, and realistic data, inside a box with the product's background. The chat's theme variables style only the page around the options; a mockup drawn with them shows the option in T3 Code's look, not the product's.
- **Screenshots of the real product** when the result depends on real rendering or real data, such as a shader, a game scene, or a dense page. Build each option behind a temporary switch with the project's variant or tuning tool, or with [prototype's UI.md](../prototype/UI.md) when the project has none.
- **Video** when movement or timing settles it, such as an animation, a loading state, or fog. If you show only stills for such a decision, say so in the reply.
- **Live link** when the user must drive it, as in "me mostra in-game": one link per option or one link with a switch. Confirm that each link answers before sending it, and say when the server stops.

Before the first browser action, read [agent-browser](../agent-browser/SKILL.md); it owns captures and video conversion.

## Lay out the page

Build one page with one block per option: its label, the visual, and one line on what it changes. Mark your pick on its label.

The reply frame is 728 px wide on desktop. Put options side by side only when the detail that decides stays readable at that width; otherwise crop each capture to the region that changes, or stack the blocks. When that region is small on the screen, show the whole screen once for context, then one crop per option at the same framing.

## Show it in the chat

Keep the page and the captures outside the repository until the user decides; a later round reuses them.

In T3 Code, run `html_preview`, inspect its image and console messages, fix what they show, then call `html_render`, whose description owns the frame rules.

- An image referenced by absolute path is inlined, including an animated WebP or GIF.
- A `<video>` that points at a local file fails with `ERR_ACCESS_DENIED`. Embed a short loop as an animated WebP or as a base64 `data:` URI, and put a longer clip in the reply as `![](/absolute/path/clip.mp4)` under its label.
- A file on disk shows nothing. Every option is either in the rendered page or embedded in the reply.

Without `html_render`, give the page's path and open no window.

## Reply and wait

Do not describe the page again. Name your pick by its label with the visible difference that decides it, say in one line how each other option loses, and state what you could not judge, such as motion from stills. Then end the turn.

When the user picks an option and the task is to make the change, apply it, remove the temporary switch and the other variants, and compare the final result with the preview the user chose. Report any difference.
