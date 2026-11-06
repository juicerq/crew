---
name: prototype
description: Build a temporary runnable experiment when the user asks to explore a behavior, rule, data model, or interface decision.
disable-model-invocation: true
---

Name the question the experiment must answer, then build the smallest runnable artifact that exposes the choice. A script may answer a transformation question; an interactive demo may reveal a state transition or layout problem.

Use [LOGIC.md](LOGIC.md) for rules, state, or data shape, and [UI.md](UI.md) for visual and interaction choices. Choose the form by the uncertainty rather than building both by default.

Keep the experiment visibly temporary and separate from production behavior. Use in-memory state and stub mutations unless persistence is the question; in that case use an authorized scratch store. Make scenarios easy to inspect and reset when comparison needs it. Follow the user's test policy.

Deliver the run instructions, observations, and the decision supported or still unresolved. A prototype can be the whole requested result. Choosing a direction does not itself request production implementation. When implementation is also requested, carry over validated decisions, review them against production requirements, and remove temporary experiment code when it no longer serves the task.
