# Verification of invariants and interleavings

Use this reference when concurrent steps, retries, state transitions, or input properties leave material uncertainty that ordinary executions cannot settle. Choose a tool for the property, rather than adding formal tooling to every task.

State the property in the project's terms and the harm when it fails. "A retry cannot apply the same stock movement twice" names an observable promise. Identify real entry points and writers that can change it.

For event ordering, a small model checker can explore a bounded model. For input properties, prefer a verifier that operates on real code when available, or generated inputs through its actual interface. A general proof may need a proof assistant. Explain which question the selected method answers.

Tie modeled variables, guards, and actions to actual files and functions. A model step is atomic only when the implementation step is atomic. Record bounds, environmental assumptions, omitted actors, and the code revision used. Combining a database read and later write into one step can hide the race being investigated.

Show the check can fail on a deliberately broken scratch variant, then restore it. Replay counterexamples against real code where possible; distinguish product defects from modeling errors. Never weaken a property merely to make the result pass.

Report the property, command and tool version, findings, scope, and limits. A bounded model verifies that model under its assumptions, not the entire implementation. Keep coverage and revision information with a reusable check, and revisit correspondence when covered code changes.
