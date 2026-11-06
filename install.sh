#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
target_home="${CREW_HOME:-$HOME}"
backup="$target_home/.crew-backup-$(date +%Y%m%d-%H%M%S)"

links=(
  agents/AGENTS.md
  agents/skills
  agents/maps
  claude/settings.json
  claude/statusline-command.sh
  claude/hooks
  claude/scripts
  claude/themes
  claude/output-styles
  codex/hooks.json
  codex/hooks
  pi/agent/extensions/agent
)

link() {
  local src="$1" dst="$2" backup_target
  mkdir -p "$(dirname "$dst")"
  if [ -L "$dst" ] && [ "$(readlink -f "$dst")" = "$(readlink -f "$src")" ]; then
    printf 'ok      %s\n' "$dst"
    return
  fi
  if [ -e "$dst" ] || [ -L "$dst" ]; then
    backup_target="$backup${dst#$target_home}"
    mkdir -p "$(dirname "$backup_target")"
    mv "$dst" "$backup_target"
    printf 'backup  %s -> %s\n' "$dst" "$backup_target"
  fi
  ln -s "$src" "$dst"
  printf 'link    %s -> %s\n' "$dst" "$src"
}

for path in "${links[@]}"; do
  link "$repo/home/$path" "$target_home/.$path"
done

link "$repo/home/agents/AGENTS.md" "$target_home/.claude/CLAUDE.md"
link "$repo/home/agents/AGENTS.md" "$target_home/.codex/AGENTS.md"
link "$target_home/.agents/skills" "$target_home/.claude/skills"

pi_extension="$repo/home/pi/agent/extensions/agent"
if command -v bun >/dev/null && [ ! -d "$pi_extension/node_modules" ]; then
  (cd "$pi_extension" && bun install --silent)
  printf 'deps    pi extension\n'
fi

missing=""
for dep in jq rg curl bun secret-tool python3; do
  command -v "$dep" >/dev/null || missing="$missing $dep"
done
if [ -n "$missing" ]; then
  printf '\nmissing dependencies:%s\n' "$missing"
  printf 'the setup still works; the features that need them degrade until installed.\n'
fi
