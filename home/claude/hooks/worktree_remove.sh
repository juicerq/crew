#!/usr/bin/env bash
set -euo pipefail

payload=$(cat)
path=$(jq -r '.worktree_path // ""' <<<"$payload")

if [[ -z "$path" ]]; then
  echo "WorktreeRemove: no worktree_path in hook payload" >&2
  exit 1
fi

git_common=$(git -C "$path" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || {
  echo "WorktreeRemove: $path is no longer a git worktree; nothing to remove" >&2
  exit 0
}

repo_root=$(dirname "$git_common")

git -C "$repo_root" worktree remove --force "$path" >&2
git -C "$repo_root" worktree prune >&2
