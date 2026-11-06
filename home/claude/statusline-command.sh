#!/usr/bin/env bash
input=$(cat)

used=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
model_total=$(echo "$input" | jq -r '.context_window.context_window_size // 0')

window="$model_total"
if [ -n "${CLAUDE_CODE_AUTO_COMPACT_WINDOW:-}" ] && [ "${CLAUDE_CODE_AUTO_COMPACT_WINDOW}" -gt 0 ] 2>/dev/null; then
  if [ "$model_total" -eq 0 ] || [ "${CLAUDE_CODE_AUTO_COMPACT_WINDOW}" -lt "$model_total" ]; then
    window="${CLAUDE_CODE_AUTO_COMPACT_WINDOW}"
  fi
fi

# auto-compact dispara em window - 20k (reserva de output) - 13k (margem), nao em window
total=$(( window - 33000 ))
[ "$total" -lt 1000 ] && total="$window"
cwd=$(echo "$input" | jq -r '.workspace.current_dir // empty')

format_tokens() {
  local n=$1
  if [ "$n" -ge 1000000 ]; then
    local tenths=$(( (n + 50000) / 100000 ))
    printf "%d.%dm" "$(( tenths / 10 ))" "$(( tenths % 10 ))"
  elif [ "$n" -ge 1000 ]; then
    printf "%dk" "$(( n / 1000 ))"
  else
    printf "%d" "$n"
  fi
}

used_fmt=$(format_tokens "$used")
total_fmt=$(format_tokens "$total")

branch=""
if [ -n "$cwd" ] && command -v git >/dev/null 2>&1; then
  branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)
fi

model=$(echo "$input" | jq -r '.model.display_name // empty' | sed 's/^GPT-/GPT /' | tr '[:upper:]' '[:lower:]')
effort=$(echo "$input" | jq -r '.effort.level // empty')

out="context: ${used_fmt}/${total_fmt}"
if [ -n "$model" ]; then
  out="${out} | model: ${model}"
  [ -n "$effort" ] && out="${out} (${effort})"
fi

[ -n "$branch" ] && out="${out} | branch: ${branch}"

printf "%s" "$out"
