---
name: retro
description: Review a coding session and propose evidence-backed improvements to the agent's environment.
disable-model-invocation: true
---

Use the session to find changes that would improve a future decision. A retrospective proposes those changes; it does not authorize editing product code or applying the recommendations. Read [writing-for-agents](../writing-for-agents/SKILL.md) when shaping instruction proposals.

## Establish what happened

Read primary sources for the session the user names, defaulting to the current session. For past work, use conversation tools or local logs. Claude Code stores logs under `~/.claude/projects/`; Codex stores them under `~/.codex/sessions/` and `~/.codex/archived_sessions/`. Match both project and session before attributing a failure, and state missing evidence.

Trace the decision that caused the observed cost or mistake. Read the proposed target and its relevant checks before recommending a change. Distinguish observed failures from opportunities; a category without evidence needs no finding.

## Choose where the lesson should live

When several incidents share a failure class, look for a structural cause before writing another rule. Could ownership, a type, or an existing boundary make the mistake harder to express? Could a deterministic check catch it? Read the repository's linter, typecheck, test commands, hooks, and CI before proposing another check. A useful check may already exist but be broken or unwired.

For example, repeated invalid state combinations may call for a domain model or type change. Repeated import violations may call for wiring an existing linter into CI. A decision about which product tradeoff is acceptable still needs written guidance. Choose text for the judgment that structure and checks cannot settle, and follow the user's test policy when proposing implementation.

Look across the session for these kinds of friction:

- **Navigation:** information or dependencies were hard to find. Prefer a pointer to the existing owner over another copy.
- **Standards and checks:** implementation or review missed a convention. Separate mechanically detectable violations from judgment calls.
- **Always-loaded instructions:** project or global instructions obscure useful guidance. Move situational detail to its relevant skill or check while keeping shared preferences and essential project pointers in scope.
- **Tool economy:** a narrower query, smaller output, or simpler available tool could have answered the same question with less time or context.
- **No-op guidance:** an instruction repeats a default or changes no decision. Remove or clarify it when it obscures useful guidance.
- **Information access:** missing evidence prevented a sound decision. Identify the source, such as development logs or read-only service access, and how it would help.

Reword, move, or remove existing guidance before adding a duplicate. A structural proposal may affect product architecture; leave it as a proposal unless the user requests implementation.

For a proposed prevention, identify the real past mistake it would reject and why the current mechanism allows it. When implementation is authorized, replay that case against the correction and confirm a legitimate neighboring case still works. A new rule or check is not proven by its presence alone.

## Keep instruction ownership intact

Coding conventions belong in the project's `code-practices` skill, which applies during implementation and review. Do not introduce a separate `CODING_STANDARDS.md`.

Put project knowledge in the project's `AGENTS.md` or an existing project skill. Keep project instructions in `AGENTS.md`, without a competing `CLAUDE.md`. Use this setup's `home/agents/AGENTS.md` only for shared preferences that hold for both Claude Code and Codex; the installer links it as `~/.codex/AGENTS.md`, `~/.agents/AGENTS.md`, and `~/.claude/CLAUDE.md`.

Reuse existing references and commands. When discovery failed, improve the pointer or skill description before expanding its body. Implementation and review may be performed by one agent or separate agents. [sol-loop](../sol-loop/SKILL.md) owns the review process. Base a finding on what the relevant stage actually missed.

Present supported candidates in severity order, with the session evidence, consequence, proposed change, and target file or tool. The user should be able to judge why each proposal would prevent a recurrence before deciding whether to implement it.

Adapted from [Matt Pocock's retro](https://github.com/mattpocock/skills/blob/main/skills/engineering/retro/SKILL.md), under the [MIT license](LICENSE).
