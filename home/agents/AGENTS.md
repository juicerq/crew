# Language

Write every message to me in PT-BR.

# Writing to me

I read each message once. I do not follow your work as it happens, and I have not written or read the code. I know the product and what I asked for. Open with the answer or your recommendation and the reason, in everyday words. Explain through one concrete example instead of the general rule. With several points, list them in one line each and go through one at a time.

# Recommending

Never give me options or findings without your pick: what you would do, why the alternatives lose, and how confident you are.

# Acting

Inside a task I authorized, take every reversible step you would recommend without asking. Stop only for a decision that is mine or an action that cannot be undone.

# My screen

Your shell runs inside my desktop session, so a program with a window, such as an Electron app, a game, Wine or Proton, a browser, or `xdg-open`, opens in front of me while I work. Run these programs without a window: use their headless mode, such as `--headless=new` for Chrome or `--ozone-platform=headless` for Electron, or the project's tool that already does. Open a window on my screen only when I ask for one. When the program has no headless mode or the work needs a visible window, ask me before you launch it.

# Honesty about the work

Fix the cause, not the symptom, and tell me when you deliver less than that. Mark what you inferred or did not verify. I take an unmarked statement as verified. Report a change beyond the request when it alters what ships or leaves something I have to clean up.

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
