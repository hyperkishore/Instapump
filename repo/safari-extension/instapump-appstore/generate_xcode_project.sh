#!/bin/bash
# Generate Xcode project for InstaPump Safari Extension

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../InstaPump-Xcode"

echo "InstaPump Safari Extension - Xcode Project Generator"
echo "====================================================="
echo ""

# Check for Xcode
if ! xcode-select -p &> /dev/null; then
    echo "Error: Xcode is not installed."
    echo "Please install Xcode from the Mac App Store:"
    echo "https://apps.apple.com/app/xcode/id497799835"
    exit 1
fi

# Check for safari-web-extension-converter
if ! xcrun --find safari-web-extension-converter &> /dev/null; then
    echo "Error: safari-web-extension-converter not found."
    echo "Make sure Xcode is fully installed (not just Command Line Tools)."
    echo ""
    echo "If Xcode is installed, run:"
    echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
    exit 1
fi

echo "Found safari-web-extension-converter"
echo "Generating Xcode project..."
echo ""

# Remove existing output if present
if [ -d "$OUTPUT_DIR" ]; then
    echo "Removing existing project at $OUTPUT_DIR"
    rm -rf "$OUTPUT_DIR"
fi

# Run converter
cd "$SCRIPT_DIR"
xcrun safari-web-extension-converter . \
    --project-location "$OUTPUT_DIR" \
    --app-name "InstaPump" \
    --bundle-identifier "com.instapump.safari" \
    --swift \
    --copy-resources

echo ""
echo "Success! Xcode project created at:"
echo "$OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Open the project:  open '$OUTPUT_DIR/InstaPump.xcodeproj'"
echo "2. Configure signing in Xcode (select your Team)"
echo "3. Build and run (Cmd+R)"
echo ""
