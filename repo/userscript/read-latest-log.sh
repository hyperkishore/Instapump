#!/bin/bash
# Read the latest InstaPump log file
WATCH_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Userscripts"

echo "📋 Latest InstaPump logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LATEST=$(ls -t "$WATCH_DIR"/instapump-*.txt 2>/dev/null | head -1)

if [[ -n "$LATEST" ]]; then
  echo "File: $(basename "$LATEST")"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  cat "$LATEST"
else
  echo "No log files found yet."
  echo "On iPhone: Tap AUTO → use app → tap STOP → Save to Files"
fi
