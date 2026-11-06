# Subagents

Don't use subagents unless explicitly told to.

# Explanations

Explain through practical scenarios and before/after comparisons. Trace the flow of data through the relevant parts to show how things work.

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
