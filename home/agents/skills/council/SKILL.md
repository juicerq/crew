---
name: council
description: Review or get feedback from a council of GPT Sol and Claude Opus, when the user says "council" or "conselho".
---

# Council

Before an audit, address outstanding PR comments, fix known issues, and run
relevant checks. Give council the updated implementation; do not defer known
fixes until reviews return. If the user wants to discard the implementation
and explore new ideas, skip fixes to code being replaced.

Bring in two delegates to help with the user's request, usually for review
or feedback. If the user's instructions name council members, use those.
Otherwise use these two, each at xhigh effort:

- GPT Sol: `gpt-6.2-sol` on Codex, `target.options`
  `{"reasoningEffort": "xhigh", "serviceTier": "default"}`.
- Claude Opus: `claude-opus-5-5` on Claude, `target.options`
  `{"effort": "xhigh"}`.

In T3 Code, use `orchestrator_capabilities` to resolve the models, then
`delegate_task` to start one delegate per model in parallel. Elsewhere, use
the harness's subagent tools. If a member is unavailable, report it instead
of substituting.

Give each delegate the request and relevant context. For review or feedback,
keep their work read-only. Collect their responses and summarize the useful
findings, disagreements, and recommended next steps.

When the request concerns code or a design, also ask each delegate to review
the design itself, including the change under review:

- Find every piece that exists only to compensate for a limitation of the
  current design, such as a sanitizer for data another layer writes wrong or
  a periodic job that searches for work an existing event already announces.
  Trace each one to the limitation that made it necessary.
- Describe the design as it would be built today from the rules it must
  satisfy, under which none of those pieces would have been written.
- Say what they recommend changing now and why.

Do not wait idle. When a result arrives, check its findings against the code
at once and decide what to fix while the other delegate runs. Do not edit
files while a delegate still reviews the same checkout. If the user's
instructions mark a delegate as non-blocking, do not wait for it; treat a
late result as feedback and do not record its score.

For a code review, ask each delegate for a score out of 10.
Count each full review pass as one round.
A fresh review after fixes starts a new round.

If the work ends in a pull request, put the results in the PR description.
Put this section at the end of the body, above the model blurb:

```markdown
## Council review

Rounds: 2

| Delegate | Round 1 | Round 2 |
| --- | --- | --- |
| GPT Sol | 8/10 | 10/10 |
| Claude Opus | 7/10 | 9/10 |
```

If a delegate gives no score, write `no score`. Do not invent one.
If the PR is open, edit the description. Do not post a comment for this.
If there is no PR, put the same results in the final reply only.

If you agree with their recommendations, make the changes and request a fresh
review after. Continue this process until all delegates are satisfied with the
outcome.

Do not let repeated reviews result in scope creep. It is your job to fight to
keep scope limited. A redesign that reaches beyond the code the request
already changes is a proposal for the user: report it with the delegate's
reasons and your own recommendation, and do not start it.
