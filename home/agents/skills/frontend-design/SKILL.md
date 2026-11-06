---
name: frontend-design
description: Shape or review interface hierarchy, content, and interaction in the product's visual language, then inspect the rendered result.
---

Start with what the user must understand or do on this screen. Arrange information and actions so their priority is visible before choosing decoration. Use realistic content and product language: labels, values, summaries, and outcomes should describe the same operation.

For an existing product, use its tokens, components, and established patterns. For a new direction, choose typography, color, spacing, and interaction from the brief and make them work together. Each element needs a meaning or function. A distinctive interface comes from choices suited to this product and task.

For example, when a page asks the user to resolve a failed payment, its status, amount, and recovery action need a clear relationship. Making every card equally prominent hides that relationship even when each card looks polished in isolation.

Inspect the actual product at the widths and reachable states affected by the change. Before the first browser action, read [agent-browser](../agent-browser/SKILL.md). Check realistic long content, feedback, and empty or error states when they occur in the flow. Confirm keyboard access, visible focus, readable contrast, and reduced-motion behavior. A static component preview cannot establish the behavior of the page around it.

Use [VISUAL-REVIEW.md](VISUAL-REVIEW.md) to diagnose a rendered problem. Correct what you observe and inspect the affected result again. Finish when the screen serves the task, its hierarchy fits the product, and the relevant interactions and widths have been checked; name an unavailable state as a gap rather than assuming it works.
