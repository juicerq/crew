# Skill mechanics

Use this reference when creating a skill or changing its metadata, discovery, or invocation.

## Package the instructions

Give each skill a `SKILL.md` with YAML frontmatter containing `name` and `description`. Make the description identify the situations that need the skill. For an automatic skill, name the decision that should trigger it; a broad topic name alone gives the selector little guidance.

Keep supporting files beside the skill. Link each procedure where the reader decides whether to use it. Resolve paths from the file containing the link, including links in generated examples.

## Choose who initiates the task

Allow automatic invocation by default. Restrict invocation to the user only when the user or the existing skill explicitly requires it. A Codex presentation file is optional unless the repository needs explicit policy or display metadata.

For a skill invoked only by the user, write a short human-facing description and set both controls:

- `disable-model-invocation: true` in `SKILL.md` for Claude Code.
- `policy.allow_implicit_invocation: false` in `agents/openai.yaml` for Codex.

An instruction saying "only when asked" does not replace these controls. Keep the description consistent with them; do not promise automatic activation for a manual task.

Preserve invocation policy during editorial changes. If the task changes that policy, update both hosts and their registration together.

## Confirm discovery

Follow the setup's existing registration and linking conventions. When Claude configuration uses `skillOverrides`, keep registrations consistent with the installed skills and verify discovery rather than inferring it from filenames.

Use a fresh session to confirm that a new or renamed skill is discoverable. Check explicit invocation for manual skills. If a host cannot be exercised, report that limitation separately from checks of the files themselves.
