# InstaPump Safari Extension

Safari Web Extension for iOS and macOS with full InstaPump functionality.

## Prerequisites

- **Xcode 15+** (free from Mac App Store)
- **macOS 13+** (Ventura or later)
- Apple Developer account (free for local testing, $99/year for App Store)

## Setup Instructions

### 1. Install Xcode

Download and install Xcode from the Mac App Store:
https://apps.apple.com/app/xcode/id497799835

After installation, open Xcode once to complete setup.

### 2. Generate Xcode Project

Run the converter script:

```bash
cd /Users/kishore/Desktop/Claude-experiments/InstaPump/repo/safari-extension/instapump-appstore
./generate_xcode_project.sh
```

Or manually:

```bash
xcrun safari-web-extension-converter . \
  --project-location ../InstaPump-Xcode \
  --app-name "InstaPump" \
  --bundle-identifier "com.instapump.safari" \
  --swift \
  --copy-resources
```

### 3. Open in Xcode

```bash
open ../InstaPump-Xcode/InstaPump.xcodeproj
```

### 4. Configure Signing

1. Select the project in the navigator (blue icon)
2. Select each target:
   - InstaPump (macOS)
   - InstaPump (iOS)
   - InstaPump Extension (macOS)
   - InstaPump Extension (iOS)
3. For each target:
   - Set **Team** to your Apple Developer account
   - Xcode will auto-generate signing certificates

### 5. Build & Run

**For macOS:**
1. Select "InstaPump (macOS)" scheme
2. Press Cmd+R or Product → Run

**For iOS Simulator:**
1. Select "InstaPump (iOS)" scheme
2. Select an iPhone simulator
3. Press Cmd+R

**For iOS Device:**
1. Connect iPhone via USB
2. Select your device as target
3. Press Cmd+R

### 6. Enable Extension

**macOS:**
1. Open Safari → Settings → Extensions
2. Enable "InstaPump"
3. Allow for instagram.com

**iOS:**
1. Open Settings → Safari → Extensions
2. Enable "InstaPump"
3. Set "All Websites" or "instagram.com"

### 7. Test

Navigate to https://www.instagram.com/reels/ in Safari

## Extension Features

- **Mode Toggle**: Discovery (see all except blocked) vs Whitelist (see only approved)
- **Swipe Gestures**: Right = approve, Left = reject
- **FAB Menu**: Tap for mode toggle, long-press for menu
- **Stats Panel**: Session and daily viewing stats
- **Popup UI**: Import/export accounts, manage lists

## File Structure

```
instapump-appstore/
├── manifest.json       # Extension manifest (Manifest V3)
├── content.js          # Full InstaPump code (~2700 lines)
├── background.js       # Minimal service worker
├── popup/
│   ├── popup.html      # Settings popup
│   ├── popup.css       # Popup styles
│   └── popup.js        # Popup logic
└── images/
    └── icon-*.png      # Extension icons (16-512px)
```

## Troubleshooting

### Extension not appearing in Safari
- Make sure you enabled it in Safari → Settings → Extensions
- Restart Safari after enabling

### Popup shows "Open Instagram Reels first"
- Navigate to instagram.com/reels in Safari
- The extension only activates on Reels pages

### Icons look wrong
- Re-run `generate_icons.py` with Python 3 + Pillow
- Or replace PNGs in `images/` with your own

## License

MIT License
