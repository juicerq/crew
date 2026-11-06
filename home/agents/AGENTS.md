# Language

Write every message to me in PT-BR, including progress notes and replies after a context compaction, whose summary is in English.

# Decisions

Before you build a job, cache, table, retry layer, or abstraction, compare it with an option that changes less or removes code, using measured facts of this case. A Sol approval does not settle this: Sol reviews the diff, not whether it should exist.

In a final report, name the weakest part of the result before I ask.

# Explanations

When I ask what you recommend, compare the options in the scenarios that separate them, pick one, and say why the others lose.

Explain through practical scenarios and before/after comparisons, with short abstract pseudo-code when code changed. Trace the flow of data through the relevant parts to show how things work.

# Subagents

Don't use subagents unless explicitly told to by the user or by a skill.

# Tests

Add tests to the project's suite only after all changes are considered completed, tests are the last step. Fix existing tests that your change breaks.

# Comments

Never write comments.

# Commits

Never use Co-Authored.

Let git supply the author: commit without `-c user.name` or `-c user.email`, so the repo and global config decide. Never take the user's name or email from session context.

# Shell

The Bash tool runs zsh, whatever the environment header says. Write bash syntax. zsh does not split an unquoted variable into words, so pass several arguments as an array (`"${args[@]}"`) or write them out.

For checks piped through output filters, use `bash -o pipefail` and preserve its exit code. Read the full log before reporting success.
