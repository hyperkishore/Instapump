#!/bin/bash
# InstaPump Log Watcher
# Monitors for new log files and displays them (no fswatch needed)

WATCH_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Userscripts"
LAST_FILE=""

echo "📡 Watching for InstaPump logs in:"
echo "   $WATCH_DIR"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

while true; do
  # Find newest .txt file
  NEWEST=$(ls -t "$WATCH_DIR"/*.txt 2>/dev/null | head -1)

  if [[ -n "$NEWEST" && "$NEWEST" != "$LAST_FILE" ]]; then
    LAST_FILE="$NEWEST"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📄 $(date '+%H:%M:%S') - $(basename "$NEWEST")"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat "$NEWEST"
    echo ""
  fi

  # Also show any new screenshots
  NEWEST_IMG=$(ls -t "$WATCH_DIR"/*.png "$WATCH_DIR"/*.PNG "$WATCH_DIR"/*.jpg "$WATCH_DIR"/*.jpeg 2>/dev/null | head -1)
  if [[ -n "$NEWEST_IMG" ]]; then
    CURRENT_IMG_TIME=$(stat -f %m "$NEWEST_IMG" 2>/dev/null)
    if [[ "$CURRENT_IMG_TIME" != "$LAST_IMG_TIME" ]]; then
      LAST_IMG_TIME="$CURRENT_IMG_TIME"
      echo "🖼️  New screenshot: $(basename "$NEWEST_IMG")"
      # Open in Preview
      open "$NEWEST_IMG" 2>/dev/null
    fi
  fi

  sleep 2
done
