# InstaScript - Safari Extension for InstaPump

A Safari extension that automatically loads InstaPump on Instagram Reels.

## Requirements

- macOS with Safari
- **Xcode** (free from Mac App Store) - required to convert and build

## Installation

### Step 1: Install Xcode

Download Xcode from the Mac App Store. It's ~12GB but required for Safari extension development.

### Step 2: Convert to Safari Extension

Open Terminal and run:

```bash
cd /Users/kishore/Desktop/Claude-experiments/InstaPump/repo/safari-extension/instascript
xcrun safari-web-extension-converter . --project-location ../InstaScript-Safari --app-name InstaScript
```

This creates an Xcode project that wraps the extension.

### Step 3: Build & Run

1. Open `../InstaScript-Safari/InstaScript.xcodeproj` in Xcode
2. Select your Mac as the target device
3. Click **Product → Run** (or press Cmd+R)
4. Xcode builds and installs the extension

### Step 4: Enable in Safari

1. Open Safari
2. Go to **Safari → Settings → Extensions**
3. Check **InstaScript** to enable it
4. Visit instagram.com/reels - InstaPump loads automatically!

## How It Works

1. Content script (`content.js`) runs on Instagram Reels pages
2. Fetches latest InstaPump from GitHub
3. Caches in localStorage for offline/fast loading
4. Executes the script in page context

## Development

The extension uses Manifest V3 format compatible with both Chrome and Safari.

### Files

- `manifest.json` - Extension manifest
- `content.js` - Content script that loads InstaPump
- `icon-48.png`, `icon-128.png` - Extension icons (create these)

### Testing Changes

1. Edit `content.js`
2. In Xcode, press Cmd+R to rebuild
3. Reload Instagram in Safari

## Troubleshooting

**Extension not showing in Safari:**
- Make sure you ran the Xcode project (Product → Run)
- Check Safari → Settings → Extensions
- Enable "Allow Unsigned Extensions" in Safari Develop menu

**InstaPump not loading:**
- Open Safari Web Inspector (Cmd+Option+I)
- Check Console for `[InstaScript]` logs
- Verify you're on a /reels or /reel/ page
