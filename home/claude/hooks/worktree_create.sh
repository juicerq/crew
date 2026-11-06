#!/usr/bin/env bash
set -euo pipefail

payload=$(cat)
name=$(jq -r '.name // ""' <<<"$payload")
cwd=$(jq -r '.cwd // ""' <<<"$payload")

if [[ -z "$name" ]]; then
  echo "WorktreeCreate: no name in hook payload" >&2
  exit 1
fi

[[ -n "$cwd" ]] || cwd=$PWD

repo_root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null) || {
  echo "WorktreeCreate: $cwd is not inside a git repository" >&2
  exit 1
}

repo=$(basename "$repo_root")
dir="$HOME/worktrees/$repo/${name//\//-}"

if git -C "$repo_root" worktree list --porcelain | grep -qxF "worktree $dir"; then
  echo "$dir"
  exit 0
fi

if [[ -e $dir ]]; then
  echo "WorktreeCreate: $dir already exists and is not a worktree of $repo_root" >&2
  exit 1
fi

mkdir -p "$(dirname "$dir")"

if git -C "$repo_root" show-ref --verify --quiet "refs/heads/$name"; then
  git -C "$repo_root" worktree add "$dir" "$name" >&2
else
  base=HEAD
  if default=$(git -C "$repo_root" symbolic-ref --quiet --short refs/remotes/origin/HEAD); then
    git -C "$repo_root" fetch --quiet origin "${default#origin/}" >&2 && base=$default
  fi
  git -C "$repo_root" worktree add "$dir" -b "$name" "$base" >&2
fi

echo "$dir"
