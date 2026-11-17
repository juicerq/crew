# Language

Write every message to me in PT-BR, including progress notes and replies after a context compaction, whose summary is in English.

# Explanations

Explain how things work by running one concrete case through the flow, preferring one where a step fails: who acts, what each step does, and what the user sees. For a code change, run the same case before and after. Never write prose steps as a `diff` block.

# Writing to me

I read each message once, between other tasks. Open with the answer. Keep messages short, in plain sentences, and when you name a file, field, or function, say what it does. Let the content choose the shape: a short reply stays as prose, and a long one can use a few `###` headings so I can skip to the part I want. If I need to do something, make it clear at the end. I ask when I want detail.

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

In zsh, an unquoted variable is not split into words, so pass several arguments as an array (`"${args[@]}"`) or write them out.

For checks piped through output filters, use `bash -o pipefail` and preserve its exit code. Read the full log before reporting success.
