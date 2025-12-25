# InstaPump

A clean, focused Instagram Reels experience with account-based filtering. Available as a **Chrome Extension** (recommended) or **Electron App**.

> **Quick Start:** See the [Chrome Extension Guide](docs/CHROME_EXTENSION_GUIDE.md) to get up and running in 2 minutes.

## Features

- **Clean UI** - Hides distracting elements (bottom nav, side buttons, comments) for immersive viewing
- **Account Filtering** - Build a whitelist of approved accounts and only see their content
- **Two Modes**:
  - **Whitelist Mode** - Only shows reels from approved accounts, auto-skips others
  - **Discovery Mode** - Shows all reels, lets you approve/reject accounts as you browse
- **Keyboard Shortcuts** - Quick navigation and account management
- **Bulk Import** - Import a list of accounts to your whitelist

## Project Structure

```
InstaPump/
├── extension/       # Chrome Extension (recommended)
├── electron-app/    # Standalone Electron App
└── docs/            # Architecture documentation
```

---

## Chrome Extension (Recommended)

### Installation

1. **Download** this repository:
   ```bash
   git clone https://github.com/hyperkishore/Instapump.git
   ```

2. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the extension**:
   - Click "Load unpacked"
   - Select the `extension` folder from this repository

4. **Navigate to Instagram Reels**:
   - Go to [instagram.com/reels](https://www.instagram.com/reels/)
   - The extension will automatically activate

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` (Right Arrow) | Approve current account (add to whitelist) |
| `←` (Left Arrow) | Reject current account (add to blocklist) |
| `↓` (Down Arrow) or `J` | Next reel |
| `↑` (Up Arrow) or `K` | Previous reel |
| `M` | Toggle between Whitelist and Discovery mode |

### On-Screen Controls

- **Green (+) button** - Approve account
- **Red (-) button** - Reject account
- **Purple (M) button** - Toggle filter mode

### Status Indicators

- **Top Left** - Current account username
- **Top Right** - Current mode (WHITELIST or DISCOVERY) with count
- **Border Color**:
  - Green border = Approved account
  - Red border = Rejected account
  - No border = Unknown account

### Popup Menu

Click the extension icon to:
- View/manage your whitelisted accounts
- Import accounts in bulk (paste usernames)
- Export your whitelist
- Switch between modes
- Clear all lists

### Development

The extension auto-reloads when you refresh Instagram:
1. Make code changes
2. Refresh the Instagram page
3. Changes are automatically applied

---

## Electron App (Alternative)

A standalone desktop app that embeds Instagram in a WebView with the same filtering capabilities.

### Installation

```bash
cd electron-app
npm install
npm start
```

### Features

- Standalone desktop application
- Same filtering and UI hiding features
- Works independently of browser

See [docs/ARCHITECTURE_ANALYSIS.md](docs/ARCHITECTURE_ANALYSIS.md) for detailed architecture documentation.

---

## Modes Explained

### Discovery Mode
- Shows all reels from any account
- Auto-skips only blocked accounts
- Use this to find new accounts and build your whitelist
- Press `→` to approve accounts you like

### Whitelist Mode
- Only shows reels from your approved accounts
- Automatically skips all other accounts
- Perfect for a curated, focused feed
- Switch to Discovery mode occasionally to find new accounts

## Bulk Import

You can import multiple accounts at once:

1. Click the extension icon (or use the Electron app UI)
2. Paste usernames in the text area (supports multiple formats):
   ```
   user1
   user2, user3
   @user4 @user5
   ```
3. Click "Import to Whitelist"

## Privacy

- All data (whitelist, blocklist, settings) is stored locally
- No data is sent to external servers
- The extension/app only interacts with Instagram

## License

MIT License - feel free to use, modify, and distribute.

---

Built with Claude Code
