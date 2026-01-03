#!/bin/bash
# Pre-sync verification script
# Run this before syncing to catch common issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
USERSCRIPT="$REPO_ROOT/userscript/instapump.user.js"

echo "🔍 InstaPump Pre-Sync Verification"
echo "==================================="
echo ""

# 1. Check version consistency
echo "📋 Version Check:"
HEADER_VERSION=$(grep -m1 "@version" "$USERSCRIPT" | sed 's/.*@version\s*//' | tr -d '[:space:]')
CONST_VERSION=$(grep -m1 "const VERSION = " "$USERSCRIPT" | sed "s/.*'\([^']*\)'.*/\1/" | tr -d '[:space:]')

echo "   Header: $HEADER_VERSION"
echo "   Const:  $CONST_VERSION"

if [ "$HEADER_VERSION" != "$CONST_VERSION" ]; then
    echo "   ❌ VERSION MISMATCH!"
    exit 1
else
    echo "   ✅ Versions match"
fi

echo ""

# 2. Check CSS structure
echo "📐 CSS Structure Check:"
BASE_CSS=$(grep -c "const BASE_CSS" "$USERSCRIPT" || echo 0)
HIDE_CSS=$(grep -c "const HIDE_CSS" "$USERSCRIPT" || echo 0)
UI_CSS=$(grep -c "const UI_CSS" "$USERSCRIPT" || echo 0)

echo "   BASE_CSS: $BASE_CSS definition(s)"
echo "   HIDE_CSS: $HIDE_CSS definition(s)"
echo "   UI_CSS:   $UI_CSS definition(s)"

if [ "$BASE_CSS" -ne 1 ] || [ "$HIDE_CSS" -ne 1 ] || [ "$UI_CSS" -ne 1 ]; then
    echo "   ⚠️  CSS structure may be broken"
else
    echo "   ✅ CSS structure correct"
fi

echo ""

# 3. Check for InstaPump UI in HIDE_CSS (bug check)
echo "🐛 Bug Check - InstaPump UI in HIDE_CSS:"
# Extract HIDE_CSS and check for #instapump
HIDE_CSS_CONTENT=$(sed -n '/const HIDE_CSS/,/^  const UI_CSS/p' "$USERSCRIPT")
if echo "$HIDE_CSS_CONTENT" | grep -q "#instapump-"; then
    echo "   ❌ WARNING: #instapump- found in HIDE_CSS area!"
    echo "   This will break UI when hiding is toggled OFF"
else
    echo "   ✅ No InstaPump UI in HIDE_CSS"
fi

echo ""

# 4. Check feature flags
echo "🚩 Feature Flags:"
if grep -q "const FEATURES = {" "$USERSCRIPT"; then
    echo "   ✅ Feature flags defined"
    grep -A 20 "const FEATURES = {" "$USERSCRIPT" | grep ":" | head -5 | while read line; do
        echo "      $line"
    done
else
    echo "   ⚠️  No feature flags found"
fi

echo ""

# 5. Check for syntax errors (basic)
echo "🔧 Syntax Check:"
if node -c "$USERSCRIPT" 2>/dev/null; then
    echo "   ✅ No syntax errors"
else
    echo "   ❌ Syntax errors found!"
    node -c "$USERSCRIPT"
    exit 1
fi

echo ""

# 6. File size check
echo "📦 File Size:"
SIZE=$(wc -c < "$USERSCRIPT")
SIZE_KB=$((SIZE / 1024))
echo "   $SIZE_KB KB ($SIZE bytes)"
if [ $SIZE_KB -gt 100 ]; then
    echo "   ⚠️  File is getting large, consider splitting"
else
    echo "   ✅ Size OK"
fi

echo ""
echo "==================================="
echo "✅ All checks passed!"
echo ""
echo "Run tests before syncing:"
echo "   cd tests && npm test"
echo ""
echo "Then sync:"
echo "   ./safari-extension/sync-and-build.sh"
