---
name: writing-for-agents
description: Write or revise skills, AGENTS.md, and other instructions that agents must use to make decisions.
---

Write the smallest document that reliably guides the decisions in its scope. Start from the task the reader must perform and the mistakes the instruction needs to prevent.

## Make the next action clear

State what the agent does, to which object, and under which condition. Keep a condition beside the action it changes. Use the same familiar name for a concept throughout the document.

Replace quality words with the observations that establish them. Instead of "verify the integration thoroughly," identify the request, result, and side effect to inspect, or point to the project recipe. A successful request can still leave an asynchronous operation pending.

Name a plausible shortcut when it would satisfy the words while missing the task. "Find the callers" may produce a list; "follow the persisted format to its readers" directs an investigation. Add this distinction where ambiguity exists.

Give the reason when it helps the reader choose in a new case. "Keep output outside the worktree so cleanup cannot erase the evidence" explains a constraint. "Ensure quality" adds no decision.

## Put each decision with its owner

Keep each rule in one authoritative place. Other documents identify when to load it. Coding conventions belong in the project's `code-practices` skill; a review instruction points there when judging code. A project command belongs in the project's skill.

Keep the common path in the main file. Put specialized procedures behind references whose links state when to read them. Preserve hard-won facts, contracts, and reasons the agent cannot recover cheaply from the environment.

Order dependent actions. Put approval, environment selection, and other preconditions before the action they constrain. State the result that permits the next step, including what to do when it remains unknown.

For metadata and invocation, read [SKILL-MECHANICS.md](SKILL-MECHANICS.md).

## Use examples to resolve ambiguity

Keep an example when two plausible interpretations lead to different decisions. Use the same concrete situation before and after, and show the distinction the reader must recognize.

"Do not add guards" rejects both symptom masking and legitimate optional values. "If absence violates the contract, fix its origin; if absence is allowed, represent and handle that result" distinguishes them.

A short instruction may need no example. A specialized skill may need executable examples and detailed caveats. Choose structure and length for the decisions; do not force every skill into the same headings.

## Review the document as instructions

Remove repeated rules, stale facts, and prose that changes no decision. When a mechanical check enforces a rule, keep only guidance needed to interpret or use it. Preserve conditions and exceptions when shortening text.

Separate editorial changes from changes to invocation, authorization, scope, tools, or completion. A clearer sentence must not quietly authorize another action.

Walk through a representative request and a nearby case outside the document's scope. Check that the reader can find the right owner, perform the required actions, and recognize completion or a named evidence gap. Verify metadata, references, and commands against their actual targets.
