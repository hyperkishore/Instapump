# InstaPump

Safari userscript for clean Instagram Reels viewing with account filtering.

## CRITICAL: File Sync Requirement

**After EVERY command that modifies files, sync between these locations:**

1. **Repo**: `/Users/kishore/Desktop/Claude-experiments/InstaPump/repo/userscript/`
2. **iCloud**: `/Users/kishore/Library/Mobile Documents/com~apple~CloudDocs/Userscripts/`
3. **Phone**: Auto-syncs from iCloud

### Sync Commands (run after every change):

```bash
# Repo -> iCloud (after editing in repo)
cp repo/userscript/instapump.user.js "/Users/kishore/Library/Mobile Documents/com~apple~CloudDocs/Userscripts/InstaPump.user.js"

# iCloud -> Repo (after testing/editing on device)
cp "/Users/kishore/Library/Mobile Documents/com~apple~CloudDocs/Userscripts/InstaPump.user.js" repo/userscript/instapump.user.js
```

---

## Current Version: 2.1.10

### Features
- **Mode Toggle**: Discovery (D) vs Whitelist (W) mode
- **FAB Menu**: Tap = toggle mode, Long-press = show menu
- **Swipe Gestures**: Right = approve, Left = reject
- **Element Picker**: Session-based picking with JSON export
- **Tap Inspector**: Debug tool to analyze element stacks at tap points
- **Logs Panel**: Debug logs with Export JSON/Copy/Clear
- **Pattern-Based Hiding**: Auto-hides UI elements across all videos
- **Clips Overlay Protection**: Audio toggle always works (protected layer)

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `<` / `>` | Reject / Approve |
| `^` / `v` / `j` / `k` | Navigate reels |
| `M` | Toggle mode |
| `P` | Toggle picker |
| `L` | Toggle logs |

### Storage Keys (localStorage)
- `instapump_allowlist` - Approved accounts
- `instapump_blocklist` - Rejected accounts
- `instapump_mode` - Current mode (discovery/whitelist)
- `instapump_hiding` - Hiding enabled/disabled

### Debug API
```javascript
window.instapump.approve()
window.instapump.reject()
window.instapump.toggleMode()
window.instapump.getAllowlist()
window.instapump.getBlocklist()
window.instapump.clearLists()
```

---

## Instagram UI Element Patterns (Updated 2025-12-25)

Instagram uses dynamic class names (e.g., `x6ikm8r`) that change frequently. These are the stable patterns identified for hiding UI elements:

### Pattern 1: Bottom Navigation Bar
```
Characteristics:
- data-visualcompletion="ignore-dynamic" (STABLE)
- textContent: "HomeExploreReelsMessages"
- Position: bottom of screen (y > vh - 80)
- Full width (w > 80% viewport)

Selector: [data-visualcompletion="ignore-dynamic"]
```

### Pattern 2: Right-Side Action Icons (Like/Comment/Share/More)
```
Characteristics:
- SVG with aria-label="Like|Comment|Share|More|Send"
- Position: right edge (x > vw - 60)
- Small size (24x24)

Selector: svg[aria-label] on right edge
```

### Pattern 3: Right-Side Button Container
```
Characteristics:
- textContent contains "Like" + "Comment" + "Share"
- Position: right edge (x > vw - 60)
- Narrow width (< 50px)

Selector: div with Like+Comment+Share text, narrow width
```

### Pattern 4: Username/Profile Row
```
Characteristics:
- textContent contains: "*Follow"
- Position: bottom 40% of screen (y > vh * 0.6)
- Height < 150px
- Does NOT contain "HomeExplore"

Selector: Elements with *Follow text in bottom area
```

### Pattern 5: Profile Images
```
Characteristics:
- IMG element
- Size: 24-44px (small circular)
- Position: bottom 40% of screen

Selector: Small images in bottom area
```

### Pattern 6: Audio Info Area
```
Characteristics:
- textContent contains "Original audio"
- Position: bottom 30% (y > vh * 0.7)
- Height < 50px

Selector: Elements with "Original audio" text
```

### Pattern 7: Caption Text
```
Characteristics:
- SPAN element
- Position: bottom 30%, left-aligned (x < 50)
- Text length > 20 chars
- Does NOT contain "Follow" or "HomeExplore"

Selector: Text spans at bottom-left
```

### Pattern 8: Engagement Counts
```
Characteristics:
- SPAN element
- Position: right edge (x > vw - 80)
- Numeric content (matches /^[\d,.KMB]+$/)
- Width < 60px

Selector: Numeric spans on right edge
```

### Pattern 9: Audio Album Art
```
Characteristics:
- Small element (20-35px)
- Position: bottom-right (x > vw - 60, y > vh * 0.7)

Selector: Small elements at bottom-right corner
```

---

## Protected Elements (NEVER Hide)

1. **Video elements**: `<video>` tags and containers
2. **Clips Overlay**: `id.startsWith('clipsoverlay')` - handles audio toggle
3. **Video containers**: Elements with class `x1ej3kyw`
4. **InstaPump UI**: Elements with `id.startsWith('instapump')`

### Clips Overlay Details
```
The clips overlay is the full-screen tap handler for:
- Mute/unmute audio toggle
- Play/pause video
- Show/hide controls

Identifying characteristics:
- id: "clipsoverlay{reel_id}_{user_id}"
- role: "button"
- size: full screen (350x537 typical)
- Contains all UI elements as children

CRITICAL: Never hide this element or audio toggle breaks!
```

---

## Architecture Decisions
- No Electron - using Safari extension via Userscripts app
- localStorage for persistence (syncs within Instagram domain)
- Mode persists across sessions
- Pattern-based hiding using position + content, not class names
- Session-based element picker for discovering new patterns
- Clips overlay protected at multiple levels (safeHide + pickerClick)

## File Structure
```
repo/userscript/
+-- instapump.user.js      # Main userscript
+-- *.txt                  # Log files
+-- *.png                  # Screenshots
+-- *.sh                   # Helper scripts
```

## Debugging Tools

### Tap Inspector
1. Open FAB menu (long-press D/W button)
2. Tap magnifying glass icon
3. Tap anywhere on screen
4. View element stack in logs panel

Shows:
- All elements at tap point (z-order)
- Interactive elements marked with lightning bolt
- Which element likely handles taps

### Element Picker
1. Open FAB menu
2. Tap scissors icon
3. Single-tap to highlight element
4. Double-tap to hide and capture data
5. Export JSON for pattern analysis

### Safari Dev Tools
- Connect iPhone to Mac
- Safari > Develop > [iPhone name] > instagram.com
- Console shows `[InstaPump]` prefixed logs
