# Compare interface directions in context

Use this form when the question is how a page should look or how a user should interact with it. For a question about rules or state transitions, use [LOGIC.md](LOGIC.md).

State the unresolved choice. A request to explore one direction can use one variant; a comparison needs enough distinct alternatives to expose the choice, often two or three. Follow a requested count. Changing the colors of the same card grid does not reveal an alternative information hierarchy.

## Put the experiment where the decision matters

Render variants on the existing route behind `?variant=`, retaining data fetching, route params, and authentication. The real header, sidebar, content density, and data constrain the design. Mount a new card or step in the page that would contain it.

Use a throwaway route only when no existing page can host it, such as a new top-level page. Follow the project's routing conventions and include `prototype` in its path or filename. Gate variants and controls with the project's development-only mechanism so production keeps its normal page.

Each variant owns its layout and has a clear exported name, such as `VariantA`. Reuse small parts like a header, but avoid a shared layout that prevents alternatives from disagreeing about structure. Keep the page's purpose, data, and styling system; vary layout, hierarchy, or primary affordance. Read real data and send mutations to stubs.

## Make the choice easy to drive

Change only the rendered subtree after existing data fetching:

```tsx
const variant = searchParams.get('variant') ?? 'A';
return (
  <>
    {variant === 'A' && <VariantA {...data} />}
    {variant === 'B' && <VariantB {...data} />}
    {variant === 'C' && <VariantC {...data} />}
    <PrototypeSwitcher variants={['A', 'B', 'C']} current={variant} />
  </>
);
```

Keep a small fixed bar at the bottom center, visually distinct from the page being judged. Show the current key and available name, such as `B: Sidebar layout`, between previous and next arrows. Arrows wrap around and update the URL through the framework's router, such as `router.replace` or `navigate`, so a variant survives reload and can be shared.

Support left and right arrow keys without intercepting them in an input, textarea, or contenteditable element. Keep the switcher with the temporary prototype and share it across variants.

Inspect each variant in the page, then deliver its URL and `?variant=` keys. “Use B's header with C's sidebar” becomes a concrete direction the user can select. Record the selected direction and reason. Apply it to production only within the scope in [SKILL.md](SKILL.md), removing temporary controls and variants when implementation is requested. Keep an archive only when the authorized workflow includes one.
