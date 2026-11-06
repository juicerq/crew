# Show architectural candidates inline

Use this reference when building the candidate report in [SKILL.md](SKILL.md). Make the before/after diagrams carry the architectural comparison, with enough evidence for the user to choose a candidate. Use the terms of the project's `code-practices` skill, when it has one, and the project's product names.

## Build one document

Use a complete HTML document. Tailwind and Mermaid load from CDNs; the rest is static HTML and CSS. Keep Mermaid's rendering as the only interactivity and add no other scripts. This scaffold supplies the theme and report regions:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Architecture review: {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      html, body { background: transparent; }
      body { margin: 0; color: var(--foreground); font-family: var(--font-sans); }
      main { width: 100%; }
      .diagram { border: 1px solid var(--border); background: var(--card); padding: 16px; border-radius: var(--radius); }
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body>
    <main class="space-y-8">
      <section id="report-context">...</section>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

Replace the placeholder content with the report. Open with compact repo and date metadata, then a legend: solid box for a module, dashed line for a seam, red arrow for leakage, thick dark box for a deep module. Follow immediately with candidates, without a banner title or introductory paragraph.

## Give each candidate a visible claim

Use one `<article>` per candidate, with these elements:

- A short action title, such as “Collapse the Order intake pipeline.”
- Recommendation strength: `Strong` in emerald, `Worth exploring` in amber, or `Speculative` in slate.
- Concrete files in `font-mono text-sm`.
- Before and after diagrams, side by side on desktop and stacked on mobile.
- One sentence naming the problem and one naming the change.
- Brief wins, at most six words each, such as “Pricing rules stop leaking” or “One interface owns intake.”

A caller should visibly shed knowledge in the after diagram. Six boxes becoming one does not establish depth if the caller still coordinates the same rules. Redraw a diagram that needs a paragraph to explain it.

Finish with one larger recommendation card: candidate name, one sentence explaining the choice, and an anchor link to that candidate.

## Choose the diagram for the relationship

Use a Mermaid flowchart for call flow or dependencies, and a sequence diagram when round-trips or ordering are the point. Style leakage edges red and the deep module dark. Wrap the diagram in the same themed panel as the other visuals. For example:

```html
<div class="diagram">
  <pre class="mermaid">
    flowchart LR
      A[Order handler] --> B[Order validator]
      B --> C[Order repository]
      C -.Pricing rule leaks.-> D[Pricing client]
      linkStyle 2 stroke:#dc2626,stroke-width:2px;
  </pre>
</div>
```

When automatic graph layout obscures the idea, use bordered `<div>` modules and inline SVG arrows in a relative container. This can show a thick deep-module boundary with faded internal steps more clearly than Mermaid.

For layered forwarding, show a cross-section: several thin horizontal bands before, one band owning the responsibility after. For a wide interface, compare rectangles representing interface and implementation size. For scattered calls, use a nested call tree before and collapse its internal calls inside one boundary after. Mix patterns when the candidates have different problems; repeating the same graph can hide those differences.

## Check the display the user will see

Use T3 theme variables for text, panels, and borders, with a transparent page background and fluid outer layout. Avoid an enclosing card, outer horizontal padding, and viewport-based heights. Give panels at least 16px padding and `var(--radius)` corners. Keep generous whitespace, with optional serif headings, and a restrained accent such as emerald or indigo, red for leakage, and amber for warnings.

Aim for diagrams around 320px tall. Fit diagrams and paths within about 728px on desktop and 360px on mobile. Use small, letter-spaced module labels (`text-xs uppercase tracking-wider`) where they read as schematic labels. Inspect the actual preview at both widths: label collisions, clipped paths, or horizontal scrolling require a layout change.

Keep prose plain and specific. “Pricing leaks across the seam” names a problem; “cleaner code” does not. Describe wins through depth, locality, or a smaller interface. Keep only sentences that help compare candidates. Follow [SKILL.md](SKILL.md) to preview and publish the completed report.
