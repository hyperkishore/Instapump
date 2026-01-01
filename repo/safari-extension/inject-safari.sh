#!/bin/bash
# InstaPump Safari Injector
# Injects InstaPump into the current Safari tab via AppleScript
#
# Usage: ./inject-safari.sh
#
# This script:
# 1. Reads the InstaPump userscript
# 2. Copies it to clipboard
# 3. Uses AppleScript to execute it in Safari

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
USERSCRIPT="$REPO_DIR/userscript/instapump.user.js"

echo "🎯 InstaPump Safari Injector"
echo "=============================="

# Check if Safari is running
if ! pgrep -x "Safari" > /dev/null; then
    echo "❌ Safari is not running. Please open Safari first."
    exit 1
fi

# Check if userscript exists
if [ ! -f "$USERSCRIPT" ]; then
    echo "❌ Userscript not found at: $USERSCRIPT"
    exit 1
fi

# Get current Safari URL
CURRENT_URL=$(osascript -e 'tell application "Safari" to tell front window to tell current tab to get URL' 2>/dev/null)

if [[ ! "$CURRENT_URL" =~ instagram.com ]]; then
    echo "⚠️  Warning: Current Safari tab is not on Instagram"
    echo "   URL: $CURRENT_URL"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📄 Reading userscript..."

# Extract IIFE (skip userscript header - lines 1-14)
IIFE_CODE=$(tail -n +15 "$USERSCRIPT")

# Wrap in try-catch and execution wrapper
INJECT_CODE="(function() {
  if (window.__instapump_loaded) {
    console.log('[Safari Inject] Already loaded');
    return 'already loaded';
  }
  try {
    console.log('[Safari Inject] Executing InstaPump...');
    $IIFE_CODE
    console.log('[Safari Inject] Done!');
    return 'success';
  } catch(e) {
    console.error('[Safari Inject] Error:', e);
    return 'error: ' + e.message;
  }
})();"

# Copy to clipboard
echo "$INJECT_CODE" | pbcopy

echo "📋 Script copied to clipboard ($(echo "$INJECT_CODE" | wc -c | tr -d ' ') bytes)"
echo "🚀 Injecting into Safari..."

# Execute via AppleScript using clipboard
RESULT=$(osascript << 'APPLESCRIPT'
tell application "Safari"
  activate
  tell front window
    tell current tab
      set clipboardContent to the clipboard
      try
        set result to do JavaScript clipboardContent
        return result
      on error errMsg
        return "Error: " & errMsg
      end try
    end tell
  end tell
end tell
APPLESCRIPT
)

echo ""
if [[ "$RESULT" == "success" ]] || [[ "$RESULT" == "already loaded" ]]; then
    echo "✅ InstaPump injected successfully!"
    echo "   Result: $RESULT"
else
    echo "❌ Injection failed"
    echo "   Result: $RESULT"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure Safari is on instagram.com/reels"
    echo "2. Check Safari's Web Inspector console for errors"
    echo "3. Try refreshing the page and running again"
fi
