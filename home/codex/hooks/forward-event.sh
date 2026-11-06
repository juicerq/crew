#!/usr/bin/env bash
set -uo pipefail

curl -sS --max-time 0.2 -X POST --data-binary @- http://127.0.0.1:47820/hooks >/dev/null 2>&1 || true
