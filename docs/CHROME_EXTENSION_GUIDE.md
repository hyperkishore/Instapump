# InstaPump Chrome Extension - Quick Start Guide

Get a clean, focused Instagram Reels experience in under 2 minutes.

---

## Installation

### Step 1: Download

```bash
git clone https://github.com/hyperkishore/Instapump.git
```

Or [download as ZIP](https://github.com/hyperkishore/Instapump/archive/refs/heads/main.zip) and extract.

### Step 2: Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension` folder from the downloaded repository

### Step 3: Start Using

Go to [instagram.com/reels](https://www.instagram.com/reels/) - the extension activates automatically.

---

## How It Works

InstaPump has two modes:

| Mode | What it does |
|------|--------------|
| **Discovery** | Shows all reels. Use this to find and approve accounts you like. |
| **Whitelist** | Only shows reels from your approved accounts. Auto-skips everyone else. |

---

## Controls

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` Right Arrow | **Approve** current account |
| `←` Left Arrow | **Reject** current account |
| `↓` Down Arrow | Next reel |
| `↑` Up Arrow | Previous reel |
| `M` | Toggle mode |

### On-Screen Buttons

- **Green (+)** - Approve account
- **Red (-)** - Reject account
- **Purple (M)** - Switch mode

### Status Indicators

- **Top-left**: Current username
- **Top-right**: Current mode + whitelist count
- **Green border**: Approved account
- **Red border**: Rejected account

---

## Quick Workflow

### Building Your Whitelist

1. Start in **Discovery mode** (press `M` if needed)
2. Scroll through reels
3. Press `→` to approve accounts you like
4. Press `←` to reject accounts you don't want to see

### Curated Viewing

1. Switch to **Whitelist mode** (press `M`)
2. Only see content from your approved accounts
3. Non-whitelisted accounts are automatically skipped

---

## Bulk Import

Already have a list of accounts? Import them all at once:

1. Click the InstaPump extension icon in Chrome toolbar
2. Paste usernames (any format works):
   ```
   user1
   user2, user3
   @user4 @user5
   ```
3. Click **Import to Whitelist**

---

## Tips

- **Start in Discovery mode** to build your whitelist
- **Switch to Whitelist mode** for focused viewing sessions
- Use the **popup menu** to manage and export your list
- The extension **auto-reloads** when you refresh Instagram

---

## Troubleshooting

**Extension not working?**
- Make sure you're on `instagram.com/reels/`
- Try refreshing the page
- Check that the extension is enabled in `chrome://extensions/`

**Username not showing?**
- Scroll slightly to trigger detection
- The username updates when a new reel is centered

---

## Privacy

- All data stays in your browser (localStorage)
- Nothing is sent to external servers
- Only runs on Instagram

---

[Back to main README](../README.md)
