#!/usr/bin/env bash
# bump.sh — increment ?v= version on style.css and script.js in index.html
#
# Why: GitHub Pages caches static assets aggressively. Bumping a query
# string forces every browser (and the GitHub Pages CDN) to fetch fresh
# CSS / JS without renaming the actual files.
#
# Usage:
#   ./bump.sh           # auto-increment by 1
#   ./bump.sh 17        # set to a specific number
#
# Run this BEFORE git commit / git push when you've changed style.css
# or script.js.

set -e

cd "$(dirname "$0")"

INDEX="index.html"

if [ ! -f "$INDEX" ]; then
  echo "bump.sh: $INDEX not found — run from project root" >&2
  exit 1
fi

# Pick out current version (looks at style.css?v=N).
CURRENT=$(perl -ne 'if (/style\.css\?v=(\d+)/) { print $1; exit }' "$INDEX")

if [ -z "$CURRENT" ]; then
  echo "bump.sh: could not find ?v= on style.css in $INDEX" >&2
  exit 1
fi

if [ -n "$1" ]; then
  NEXT="$1"
else
  NEXT=$((CURRENT + 1))
fi

# Replace BOTH style.css?v=… and script.js?v=…
perl -i -pe "s|style\\.css\\?v=\\d+|style.css?v=${NEXT}|g; s|script\\.js\\?v=\\d+|script.js?v=${NEXT}|g" "$INDEX"

echo "bumped: v=${CURRENT} → v=${NEXT}"
