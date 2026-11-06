#!/usr/bin/env bash
set -uo pipefail

query=$(jq -r '.query // ""')

if [[ -z "$query" ]]; then
  exit 0
fi

build_regex() {
  local q="$1"
  echo "$q" | sed 's/./&.*/g'
}

regex=$(build_regex "$query")

git_root=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

list_entries() {
  rg --files --follow --hidden --glob '!.git' "$1" 2>/dev/null | awk '{
    print
    n = split($0, a, "/")
    p = ""
    for (i = 1; i < n; i++) {
      p = (i > 1 ? p "/" : "") a[i]
      if (!d[p]++) print p
    }
  }'
}

results=$(
  {
    list_entries "$PWD"
    if [[ "$git_root" != "$PWD" ]]; then
      list_entries "$git_root"
    fi
  } | grep -iE "$regex" | awk '!seen[$0]++' | sed "s|^$git_root/||" | awk '{print length, $0}' | sort -n | cut -d' ' -f2- | head -20
)

printf '%s\n' "$results"
