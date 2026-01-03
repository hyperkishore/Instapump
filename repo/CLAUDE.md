# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Commit Requirement

**IMPORTANT:** Git commit and push after every milestone.

---

## Code Review Requirement

**IMPORTANT:** Before committing any code changes, perform at least 2 rounds of code review checking for:
- Bugs and logic errors
- CSS specificity issues (inline styles override classes)
- Missing event handlers or incorrect element IDs
- Syntax errors
- Mobile responsiveness issues
- Edge cases and error handling

---

## Chrome Testing Requirement

**IMPORTANT:** After pushing changes, test the extension in Chrome using Claude in Chrome MCP tools:

### Testing Steps:
1. After `git push`, use `mcp__claude-in-chrome__tabs_context_mcp` to get browser context
2. Navigate to Instagram Reels: `mcp__claude-in-chrome__navigate` to `https://www.instagram.com/reels/`
3. Wait for page load (3 seconds)
4. Take screenshot to verify UI is rendering: `mcp__claude-in-chrome__computer` with `action: screenshot`
5. Test core functionality:
   - Scroll through reels (arrow keys or scroll)
   - Verify videos load properly
   - Check for console errors: `mcp__claude-in-chrome__read_console_messages`

### Quick Test Sequence:
```
1. tabs_context_mcp (get tab ID)
2. navigate to instagram.com/reels
3. wait 3 seconds
4. screenshot (note the URL and username)
5. scroll down once
6. screenshot (verify URL changed to a NEW reel)
7. repeat scroll+screenshot 3-5 times, verifying URL changes each time
8. read_console_messages (check for errors)
```

### What to Verify:
- [ ] Extension UI renders (FAB button visible)
- [ ] Videos play correctly
- [ ] **Each scroll loads a NEW reel** (URL changes from `/reels/ABC` to `/reels/XYZ`)
- [ ] Username display updates with each new reel
- [ ] No JavaScript errors in console
- [ ] Mode toggle works (if testing that feature)

**Note:** The Chrome extension at `repo/extension/` must be synced with the userscript after changes. The extension loads from the local folder, so reload it in `chrome://extensions/` to pick up changes.

---

## Current Session Notes (2026-01-03)

### v2.1.66 Status (Latest)
- ✅ **Video displays properly** on iOS Safari
- ✅ **Auto-advance working** - Uses timestamp validation (2000ms threshold)
- ✅ **FAB overlap fixed** - Moved from bottom:100px to bottom:160px
- ✅ **Scroll up improved** - Uses `block: 'center'` + fallback scroll

### Version History This Session
- **v2.1.62** - Auto-advance timestamp fix (2000ms threshold)
- **v2.1.63** - FAB position fix, removed aggressive video CSS
- **v2.1.64** - Added flexbox centering (BROKE video display)
- **v2.1.65** - Improved scroll up reliability
- **v2.1.66** - Removed flexbox CSS that broke video (hotfix)

### Key Learnings
- **Don't use `display: flex` on clipsoverlay** - Breaks Instagram's video layout
- **Don't force video dimensions** - `video { width:100vw; height:100dvh }` hides video on iOS
- **Don't use `main * { background-color }** - Too broad, affects video

### All Distributions Synced
All platforms verified at v2.1.66 with identical code:
- `userscript/instapump.user.js`
- `extension/content.js` (Chrome)
- `safari-extension/instapump-appstore/content.js`
- `safari-extension/InstaPump-Xcode/.../content.js`
- iCloud Userscripts folder

---

# InstaPump

Safari userscript for clean Instagram Reels viewing with account filtering. Also available as Chrome Extension and Electron app.

**GitHub**: https://github.com/hyperkishore/Instapump

---

## Marketing & Copy Guidelines

When working on marketing tasks (landing pages, copy, campaigns, value propositions):

**Adopt the mindset of a psychologist turned marketer** who understands:

1. **Deep Human Motivations** - Go beyond surface features. Understand the emotional pain points: guilt after doomscrolling, anxiety from algorithm manipulation, loss of agency over attention
2. **Identity & Aspiration** - People don't buy products, they buy better versions of themselves. Who does the user want to become?
3. **Social Proof & Belonging** - Humans are tribal. Frame the product as joining a movement of people who've "woken up"
4. **Loss Aversion** - What are they losing every day they don't use this? (Time, mental clarity, creative energy)
5. **Cognitive Ease** - Apple-style simplicity. One clear message per section. Let whitespace breathe.
6. **Pattern Interrupts** - Break expectations. If everyone says "take control", find a fresher angle
7. **Specificity > Vagueness** - "47 minutes of your life back daily" beats "save time"

**Viral mechanics to consider:**
- Shareable identity statements ("I'm the person who...")
- Before/after transformations
- Counter-positioning against the "enemy" (the algorithm, big tech, attention merchants)
- Making the user the hero of their own story

---

## CRITICAL: File Sync Requirement

**After EVERY change to `userscript/instapump.user.js`, run the unified sync script:**

```bash
./safari-extension/sync-and-build.sh
```

This single command syncs to ALL distribution methods:

| Method | Location | Users |
|--------|----------|-------|
| **iCloud** | `~/Library/Mobile Documents/.../Userscripts/` | Userscripts app users |
| **Safari Extension** | `safari-extension/instapump-appstore/` | App Store users |
| **Xcode Project** | `safari-extension/InstaPump-Xcode/` | For building App Store release |

### Manual Sync (if needed):

```bash
# Repo -> iCloud only
cp repo/userscript/instapump.user.js "/Users/kishore/Library/Mobile Documents/com~apple~CloudDocs/Userscripts/InstaPump.user.js"

# iCloud -> Repo (after testing/editing on device)
cp "/Users/kishore/Library/Mobile Documents/com~apple~CloudDocs/Userscripts/InstaPump.user.js" repo/userscript/instapump.user.js
```

---

## Current Version: 2.1.59

### Features
- **Mode Toggle**: Discovery (D) vs Whitelist (W) mode
- **FAB Menu**: Tap = toggle mode, Long-press = show menu
- **Swipe Gestures**: Right = approve, Left = reject (simulates tap to resume)
- **List Viewer**: View/manage whitelist and blocklist (📝 button)
- **List Count Display**: Shows `W:# B:#` below version badge
- **Auto-Advance**: Moves to next video when current one finishes
- **URL Bar Auto-Hide**: Triggers Safari URL bar collapse on load
- **Element Picker**: Session-based picking with JSON export
- **Tap Inspector**: Debug tool to analyze element stacks at tap points
- **Logs Panel**: Debug logs with Export JSON/Copy/Clear
- **Pattern-Based Hiding**: Auto-hides UI elements across all videos
- **Clips Overlay Protection**: Audio toggle always works (protected layer)
- **Version Badge**: Shows current version in top-right corner
- **Stats Panel**: Session and daily stats (📊 button) - reels skipped/viewed, time saved
- **Time Reminders**: Gentle 30-minute scrolling reminder with stats summary
- **Reels-Only Mode**: Extension only runs on /reels and /reel/ pages
- **SPA Navigation Detection**: UI hides when navigating away from reels

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `→` / `←` | Approve / Reject |
| `↓` / `↑` / `j` / `k` | Navigate reels |
| `M` | Toggle mode |
| `P` | Toggle picker |
| `L` | Toggle logs |

### FAB Menu Buttons
| Icon | Action |
|------|--------|
| `D` / `W` | Current mode (tap to toggle, long-press for menu) |
| 📊 | Stats panel (session + daily stats) |
| 📝 | List viewer panel |
| ✂ | Element picker |
| 📋 | Logs panel |
| 👁 | Toggle hiding (green=on, red=off) |
| 🔍 | Tap inspector |

### Storage Keys (localStorage)
- `instapump_allowlist` - Approved accounts (persists across refreshes)
- `instapump_blocklist` - Rejected accounts (persists across refreshes)
- `instapump_mode` - Current mode (discovery/whitelist)
- `instapump_hiding` - Hiding enabled/disabled
- `instapump_daily_stats` - Daily stats (reels skipped/viewed per day)

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

## Mode Behavior

### Discovery Mode (D) - Blue button
**Purpose:** Explore new content, filter out accounts you've rejected

```
When a reel appears:
├── Is account in BLOCKLIST?
│   ├── YES → Auto-skip to next reel, show "Skipping @username"
│   └── NO → Play the reel (even if not in allowlist)
```

**Use case:** Finding new accounts to follow. You see everything EXCEPT accounts you've explicitly rejected.

### Whitelist Mode (W) - Green button
**Purpose:** Only watch content from approved accounts

```
When a reel appears:
├── Is account in ALLOWLIST?
│   ├── YES → Play the reel
│   └── NO → Auto-skip to next reel, show "Not whitelisted: @username"
```

**Use case:** Curated viewing. Only see content from accounts you've approved.

### User Actions

| Action | Effect on Allowlist | Effect on Blocklist |
|--------|---------------------|---------------------|
| Swipe RIGHT (approve) | ADD to allowlist | REMOVE from blocklist |
| Swipe LEFT (reject) | REMOVE from allowlist | ADD to blocklist |

### Mode Filter Flow

```
User scrolls to new reel
        ↓
detectUsername() finds @username
        ↓
applyModeFilter(@username)
        ↓
    ┌─────────────────────────────────────┐
    │  Mode = Discovery?                  │
    │  ├── YES: Is @user in blocklist?    │
    │  │        ├── YES → SKIP            │
    │  │        └── NO → PLAY             │
    │  └── NO (Whitelist mode):           │
    │           Is @user in allowlist?    │
    │           ├── YES → PLAY            │
    │           └── NO → SKIP             │
    └─────────────────────────────────────┘
```

---

## Version History (Recent)

### v2.1.49 - Session stats tracking and time reminders
- Added session stats tracking (reels skipped, viewed, time spent)
- Added daily stats persistence in localStorage
- Added stats panel (📊 icon in FAB menu) with live updates
- Added 30-minute scrolling time reminder with stats summary
- Stats panel shows: time scrolling, reels skipped/viewed, time saved
- Daily stats section shows today's totals

### v2.1.48 - Polling fallback for URL change detection
- Added 500ms polling interval to catch SPA navigation
- Catches cases where Instagram's internal navigation doesn't trigger history events

### v2.1.47 - Hide UI when navigating away from reels (SPA)
- Added `toggleInstaPumpUI(visible)` function to hide/show all UI elements
- Intercept `history.pushState` and `replaceState`
- Listen for `popstate` event for back/forward navigation
- Fixed CSS `<style>` element being hidden with `:not(style)` selector

### v2.1.45-46 - Reels-only functionality
- Extension only runs on `/reels` and `/reel/` pages
- Silent exit on non-reels pages (no console output)
- Fixed `/reel/ABC123` not matching (singular reel URLs)

### v2.1.44 - Restore missing findVisibleVideo helper
- Added back `findVisibleVideo()` helper function removed during v2.1.43 cleanup
- Fixed hardcoded version string in log (was "v2.1.38", now uses VERSION constant)

### v2.1.43 - Restore FAB functionality after UI redesign
- Restored `tryOverlayClick()` function that was accidentally removed in v2.1.42
- Restored proper `resumeVideoAfterSwipe()` with fallback logic:
  1. Try `video.play()` first
  2. Fall back to `overlay.click()` if video still paused after 100ms
  3. Added 300ms verification check with retry
- Fixed FAB tap/long-press functionality broken by UI changes

### v2.1.42 - FAB UI redesign (minimal black/white)
- Redesigned FAB to minimal aesthetic
- Black background with white text
- Introduced bugs fixed in v2.1.43-v2.1.44

### v2.1.32 - Video resume after horizontal swipe
- Added `resumeVideoAfterSwipe()` function
- Detects horizontal swipe and calls resume logic
- Multi-method resume: video.play() first, then overlay.click() fallback
- Added 300ms check to verify video resumed, retries if still paused
- Comprehensive logging to debug resume behavior

### v2.1.30 - Fixed navigation with scrollIntoView
- Changed navigation from `scrollBy` to `scrollIntoView` on target overlay
- Find current visible overlay by index, scroll to next/prev
- Auto-advance now working correctly

### v2.1.29 - Debounced auto-advance
- Fixed triple-scroll issue (timeupdate + ended + seeking all firing)
- Added `debounceAdvance()` function with 1 second cooldown

### v2.1.27 - Fixed duration detection
- Fixed NaN duration by checking `isNaN(video.duration)`
- Better logging for video metadata with `loadedmetadata` event

### v2.1.25 - Auto-advance improvements
- Added loop detection via 'seeking' event
- Tighter threshold (0.3s instead of 0.5s)

### v2.1.24 - Viewport resize handling
- Added `handleViewportResize()` to re-align videos when viewport changes
- Handles Safari toolbar hide/show

### v2.1.23 - Simplified navigation
- Uses `scrollBy` with scroll-snap for alignment

### v2.1.22 - URL bar hide + navigation debugging
- Added `hideUrlBar()` - triggers `window.scrollTo(0, 1)` on load
- Safari collapses URL bar when page scrolls
- Added detailed logging to `navigateReel()` for debugging
- Multi-method scroll fallback when stuck at end:
  1. `window.scrollBy()` on window
  2. `scrollContainer.scrollBy()` on main element
  3. Simulated touch events on overlay

### v2.1.21 - Simulate tap to resume after swipe
- Removed aggressive `e.preventDefault()` and `e.stopPropagation()`
- Changed touchend back to `{ passive: true }`
- After swipe, simulate tap on clips overlay to resume video
- Uses Instagram's own play/pause mechanism instead of fighting it

**Root cause analysis:** v2.1.17's `stopPropagation()` was breaking Instagram's gesture recognition. Instagram paused on touchstart, but blocking touchend prevented Instagram from completing its gesture handling properly.

### v2.1.20 - Resume video after swipe (superseded by v2.1.21)
- Instagram pauses on touchstart, we detect swipe on touchend
- After swipe detected, call video.play() to resume playback
- **Issue:** video.play() was being overridden by Instagram's handlers

### v2.1.19 - Fixed auto-advance video detection
- Added isVisibleVideo() using bounding rect check
- Video must cover >50% viewport to be considered active

### v2.1.18 - Auto-advance to next video
- Tracks videos with WeakSet
- Listens for 'ended' event and 'timeupdate' near end
- Only advances if video is visible

### v2.1.17 - Fixed swipe causing video pause
- Added preventDefault() and stopPropagation() on swipe detect
- Changed touchend to passive: false

### v2.1.16 - List count display and viewer panel
- W:# B:# count below version badge
- 📝 button opens list viewer with tabs
- Remove button to delete accounts from lists

### v2.1.15 - Fixed navigation to use clips overlays
- Instagram has no `<article>` elements
- navigateReel() now uses `[id^="clipsoverlay"]`

### v2.1.14 - Username detection via aria-label
- Search WITHIN clips overlay for `a[aria-label$=" reels"]`
- Parse "username reels" format

### v2.1.12-stable - Tagged stable version
- Audio toggle working
- UI hiding working
- Git tag: `v2.1.12-stable`

---

## Username Detection

Instagram Reels username is found via:

```
DOM Structure:
SPAN (textContent: "username")
  → DIV
    → A (aria-label: "username reels", role: "link")  ← KEY ELEMENT
      → DIV
        → DIV
          → DIV
            → DIV (role: "button")  ← Clips overlay
```

**Detection Method:**
1. Find visible clips overlay (>50% viewport)
2. Search within: `overlay.querySelector('a[aria-label$=" reels"]')`
3. Parse aria-label: `"username reels"` → extract `username`

**Key insight:** `insideArticle: false` - Instagram Reels has NO article elements.

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
3. **Elements containing clips overlay**: `el.querySelector('[id^="clipsoverlay"]')`
4. **Video containers**: Elements with class `x1ej3kyw` or containing video
5. **InstaPump UI**: Elements with `id.startsWith('instapump')`

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
Also: Never hide PARENTS of this element!
```

### safeHide() Protection Logic
```javascript
function safeHide(el) {
  if (!el) return false;
  if (isInstaPumpElement(el)) return false;
  if (isVideoContainer(el)) return false;
  if (isClipsOverlay(el)) return false;
  if (el.querySelector('[id^="clipsoverlay"]')) return false; // Contains overlay
  // ... proceed to hide
}
```

---

## URL Bar Auto-Hide

Safari on iOS hides the URL bar when the page scrolls. We trigger this on load:

```javascript
function hideUrlBar() {
  setTimeout(() => {
    window.scrollTo(0, 1);
  }, 100);
}
```

Called in `init()` to give users a cleaner full-screen experience.

---

## Navigation

**Instagram Reels uses clips overlays, NOT articles.**

```javascript
function navigateReel(direction) {
  const overlays = document.querySelectorAll('[id^="clipsoverlay"]');
  log(`navigateReel(${direction}): found ${overlays.length} overlays`);
  // Find most visible overlay, scroll to next/prev
}
```

**Multi-method fallback when stuck at end:**
1. `window.scrollBy({ top: vh, behavior: 'smooth' })`
2. `scrollContainer.scrollBy()` on main element (100ms delay)
3. Simulated touch events on current overlay (200ms delay)

**Debugging stuck navigation:**
- Open logs panel (📋)
- Navigate (swipe up or ↓ key)
- Check logs for overlay count and current index
- If `Current overlay: 0/0`, Instagram only loaded 1 overlay

---

## Auto-Advance

Automatically moves to next video when current finishes:

1. Track all videos with WeakSet
2. Listen for 'ended' event (non-looping videos)
3. Listen for 'timeupdate' and detect when near end (<0.5s left)
4. Check `isVisibleVideo()` - video covers >50% viewport
5. Use data attribute flag to prevent duplicate advances
6. Call `navigateReel('next')` after 500ms delay

---

## Swipe Gestures

**Problem:** Instagram pauses video on touchstart, we detect swipe on touchend.

**Failed approaches (v2.1.17-v2.1.20):**
- `e.preventDefault()` + `e.stopPropagation()` → Broke Instagram's gesture recognition
- Direct `video.play()` → Instagram's handlers overrode it

**Working solution (v2.1.21+):** Simulate a tap on clips overlay after swipe:
```javascript
document.addEventListener('touchend', (e) => {
  // ... swipe detection ...
  if (isHorizontalSwipe) {
    // Don't block events - let Instagram complete its handling
    // Then simulate a tap to toggle play back on
    setTimeout(() => {
      const overlay = getVisibleClipsOverlay();
      if (overlay) overlay.click();
    }, 50);
    // Handle approve/reject...
  }
}, { passive: true }); // Don't fight Instagram
```

**Key insight:** Work WITH Instagram's mechanisms, not against them.

---

## Architecture Decisions
- No Electron - using Safari extension via Userscripts app
- localStorage for persistence (syncs within Instagram domain)
- Mode persists across sessions
- Pattern-based hiding using position + content, not class names
- Session-based element picker for discovering new patterns
- Clips overlay protected at multiple levels (safeHide + pickerClick)
- Navigation via clips overlays, not articles
- Video visibility check via bounding rect, not DOM structure

## File Structure
```
repo/userscript/
├── instapump.user.js      # Main userscript
├── *.txt                  # Log files
├── *.png                  # Screenshots
└── *.sh                   # Helper scripts
```

## Debugging Tools

### Tap Inspector
1. Open FAB menu (long-press D/W button)
2. Tap magnifying glass icon 🔍
3. Tap anywhere on screen
4. View element stack in logs panel

Shows:
- All elements at tap point (z-order)
- Interactive elements marked with lightning bolt
- Which element likely handles taps

### Element Picker
1. Open FAB menu
2. Tap scissors icon ✂
3. Single-tap to highlight element
4. Double-tap to hide and capture data
5. Export JSON for pattern analysis

### List Viewer
1. Open FAB menu
2. Tap 📝 icon
3. Switch between Whitelist/Blocked tabs
4. Tap × to remove accounts

### Safari Dev Tools
- Connect iPhone to Mac
- Safari > Develop > [iPhone name] > instagram.com
- Console shows `[InstaPump]` prefixed logs

---

## Full Project Structure

```
InstaPump/
├── repo/
│   ├── CLAUDE.md                       # This file
│   ├── README.md                       # Project overview
│   ├── userscript/
│   │   └── instapump.user.js           # PRIMARY - Safari userscript
│   ├── extension/                      # Chrome Extension
│   │   ├── manifest.json
│   │   ├── content.js                  # Main content script
│   │   ├── background.js
│   │   ├── popup.js / popup.html       # Extension popup UI
│   │   └── styles.css
│   ├── electron-app/                   # Standalone Electron app
│   │   ├── main.js                     # Electron main process
│   │   ├── preload.js
│   │   ├── package.json
│   │   └── renderer/                   # UI components
│   └── docs/                           # Architecture documentation
├── instapump-app/                      # Legacy Electron dev folder
└── instapump-extension/                # Legacy extension folder
```

---

## Development Commands

### Userscript Development
1. Edit `repo/userscript/instapump.user.js`
2. Bump version in userscript header AND console.log statement
3. Sync to iCloud (see sync command at top of this file)
4. Refresh Instagram on iPhone

### Chrome Extension Development
```bash
# Load extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select repo/extension/ folder

# After code changes:
# 1. Click refresh icon on extension in chrome://extensions/
# 2. Reload Instagram tab
```

### Electron App Development
```bash
cd repo/electron-app
npm install
npm start        # Standard run
npm run dev      # With logging enabled
```

---

## Auto-Update Architecture (Loader Pattern)

For Safari Userscripts app users, we use a **loader pattern** for seamless auto-updates:

```
┌─────────────────────────────────────────────────────────────┐
│  FILESYSTEM (iCloud/Userscripts folder)                     │
│  ┌─────────────────────────────────────┐                    │
│  │  instapump-loader.user.js           │                    │
│  │  - Tiny loader (~150 lines)         │  ← NEVER CHANGES   │
│  │  - Installed once                   │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  LOCALSTORAGE (browser, instagram.com domain)               │
│  ┌─────────────────────────────────────┐                    │
│  │  instapump_cached_code              │                    │
│  │  - Full script (~2000 lines)        │  ← AUTO-UPDATES    │
│  │  - Fetched from GitHub              │                    │
│  │  instapump_cached_version           │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### How It Works

1. **First Load (no cache)**:
   - Loader fetches full script from GitHub
   - Saves to localStorage
   - Executes immediately

2. **Subsequent Loads (cached)**:
   - Loader runs cached code instantly (fast!)
   - Background fetch checks for updates
   - If newer version found → saves to localStorage + shows toast
   - Next refresh applies the update

3. **Offline Mode**:
   - Runs cached version (works fine)
   - Update check silently fails (no error)

### Two Installation Methods

| Method | File | Auto-Updates | Best For |
|--------|------|--------------|----------|
| **Loader** | `instapump-loader.user.js` | ✅ Yes | Safari Userscripts app |
| **Standalone** | `instapump.user.js` | Via @updateURL | Tampermonkey, Greasemonkey |

### Key Files

- `instapump-loader.user.js` - Tiny loader, user installs this once
- `instapump.user.js` - Full script, fetched/cached by loader

### Flags

- `window.__instapump_loader` - Set by loader, signals main script to skip its own update check
- `window.__instapump_loaded` - Prevents double execution
- `LOADED_VIA_LOADER` - Constant in main script to check loader status

---

## Website & Landing Page

### Live URL
**https://hyperkishore.github.io/Instapump**

GitHub Pages serves from the `/docs` folder at repo root.

### File Structure
```
/docs/                          # GitHub Pages root (NOT repo/docs/)
├── index.html                  # Landing page
├── install.html                # Step-by-step install guide
├── style.css                   # Apple-inspired dark theme
└── script.js                   # Rotating heroes, live counter, animations
```

### Movement Branding: Algorithm Atheists

**Identity:** "The Attention Reclamation Project"

**Movement Name:** Algorithm Atheists
- "We don't believe in algorithmic gods"
- Counter-position against Big Tech attention merchants

**Key Phrases:**
- "We don't negotiate with algorithms." (Primary tagline)
- "My attention isn't for sale."
- "I opt out."
- "I choose my feed."
- "I'm not a product."

**Origin Story (The Realization):**
> "I spent 3 hours watching Reels from accounts I never chose to follow. The algorithm knew exactly what would keep me hooked.
>
> That's when I understood: I wasn't the customer. I was the product.
>
> I built InstaPump to become the customer again."

### Landing Page Structure

1. **Hero Section** - Rotating headlines based on visit count
   - 5 hero variants stored in `heroes[]` array
   - Uses localStorage `instapump_visit_count` for rotation

2. **Origin Story** - Personal confession/transformation

3. **The Problem** - 4 cards explaining algorithm manipulation
   - "It learns your triggers"
   - "It optimizes for their profit"
   - "It exploits slot machine psychology"
   - "It's invisible" (always last, has "Until now")

4. **The Flip** - Before/After comparison
   - Their Instagram vs Your Instagram
   - Strikethrough on "before" items

5. **How It Works** - Three gestures (Swipe Left/Right, Scroll)

6. **Algorithm Atheists** - Identity statements
   - 4 rotating statement cards (shuffled per visit)

7. **The Mission** - Live counter from GitHub
   - Fetches stars + forks + watchers as "people who opted out"
   - Animated counter on page load

8. **Install CTA** - Links to install.html

### Install Page Flow

**Simplified 3-step flow:**

1. **Get the App** - Link to Userscripts app on App Store
2. **Enable Extension** - Settings → Safari → Extensions → Enable
3. **Install Script** - Download button + animated arrow overlay

**Animated Arrow Overlay:**
When user clicks "Download InstaPump", shows overlay pointing to Safari toolbar:
- Arrow pointing up (↑)
- "Now tap the Userscripts icon in Safari's toolbar"
- Puzzle piece icon
- "Got it" dismiss button

This guides users through the Userscripts popup install flow, which is simpler than "Save to Files".

### Key Technical Notes

- **GitHub Pages path:** Files must be at root `/docs/` not `repo/docs/`
- **Userscripts popup install:** Visiting .user.js URL + tapping extension icon shows "Install" button
- **Live counter:** `fetchGitHubStats()` calls GitHub API for repo engagement metrics
- **Visit-based variation:** Hero headlines, statement cards, and problem cards shuffle based on localStorage visit count

### Design Principles

1. **Apple-inspired aesthetic** - Dark theme, plenty of whitespace, SF Pro/Inter fonts
2. **Single clear message per section** - No clutter
3. **Movement-based marketing** - Users join a tribe, not just download software
4. **Counter-positioning** - "Algorithm" is the enemy, user autonomy is the hero
5. **Specificity over vagueness** - Real numbers, concrete transformations

---

## Safari Web Extension (App Store)

### Overview

Native Safari Web Extension for iOS 15+ and macOS 12+, distributed via App Store. Contains full InstaPump functionality embedded (not loaded from GitHub).

**Location:** `repo/safari-extension/instapump-appstore/`

### Architecture

```
instapump-appstore/
├── manifest.json              # Manifest V3 (Safari-compatible)
├── content.js                 # Full InstaPump (~2,678 lines)
├── background.js              # Minimal service worker
├── popup/
│   ├── popup.html             # Settings popup UI
│   ├── popup.css              # Dark theme styling
│   └── popup.js               # Uses browser.tabs.sendMessage
├── images/
│   └── icon-{16-512}.png      # Extension icons
├── generate_icons.py          # Icon generation script (requires Pillow)
├── generate_xcode_project.sh  # Xcode project generator
└── README.md                  # Setup instructions
```

### Key Technical Decisions

1. **Embedded code (not loader)** - App Store requires no remote code execution
2. **browser.* APIs** - Safari uses `browser.tabs.sendMessage`, NOT `chrome.scripting.executeScript`
3. **localStorage only** - No `chrome.storage` available; content script manages all state
4. **Message-based communication** - Popup sends messages to content script

### Message Protocol (Popup ↔ Content Script)

| Message Type | Direction | Purpose |
|--------------|-----------|---------|
| `GET_STATE` | popup → content | Get mode, lists, stats, version |
| `SET_MODE` | popup → content | Change to discovery/whitelist |
| `IMPORT_ALLOWLIST` | popup → content | Add usernames to allowlist |
| `CLEAR_LISTS` | popup → content | Clear all lists |
| `REMOVE_FROM_LIST` | popup → content | Remove single username |

**Content script listener location:** End of `content.js` (lines 2597-2677)

### Milestones Progress

| Milestone | Status | Description |
|-----------|--------|-------------|
| M1 | ✅ Done | Extension structure + manifest.json |
| M2 | ✅ Done | Embed InstaPump + message listeners |
| M3 | ✅ Done | Popup UI (HTML/CSS/JS) |
| M4 | ✅ Done | Generate icons (16-512px) |
| M5 | ✅ Done | Xcode generation script |
| M6 | ⏳ Pending | Customize iOS SwiftUI onboarding |
| M7 | ⏳ Pending | Customize macOS onboarding |
| M8 | ⏳ Pending | Test on macOS Safari |
| M9 | ⏳ Pending | Test on iOS Simulator |
| M10 | ⏳ Pending | Final polish + documentation |

### Continuing Development (Once Xcode Installed)

**Step 1: Generate Xcode Project**
```bash
cd repo/safari-extension/instapump-appstore
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

**Step 2: Open in Xcode**
```bash
open ../InstaPump-Xcode/InstaPump.xcodeproj
```

**Step 3: Configure Signing**
- Select project in navigator
- For each target (macOS app, iOS app, macOS extension, iOS extension):
  - Set Team to Apple Developer account
  - Xcode auto-generates signing certificates

**Step 4: Build & Run**
- macOS: Select "InstaPump (macOS)" scheme → Cmd+R
- iOS Simulator: Select "InstaPump (iOS)" scheme + simulator → Cmd+R
- iOS Device: Connect iPhone, select device → Cmd+R

**Step 5: Enable Extension**
- macOS: Safari → Settings → Extensions → Enable InstaPump
- iOS: Settings → Safari → Extensions → Enable InstaPump

**Step 6: Test**
- Navigate to https://www.instagram.com/reels/
- Verify FAB appears, mode toggle works, swipe gestures work
- Test popup (click extension icon)

### M6: iOS SwiftUI Onboarding (TODO)

After Xcode project generation, customize `InstaPump iOS/ContentView.swift`:

```swift
// Key components to add:
// 1. App icon/logo display
// 2. Step-by-step enable instructions
// 3. "Open Safari Settings" button
// 4. "Open Instagram Reels" button
```

### M7: macOS Onboarding (TODO)

Customize `InstaPump/ViewController.swift` or convert to SwiftUI:
- Similar to iOS but with macOS-specific UI
- Link to Safari Preferences for enabling extension

### Testing Checklist

| Feature | iOS | macOS |
|---------|-----|-------|
| Extension loads on /reels | [ ] | [ ] |
| FAB appears bottom-right | [ ] | [ ] |
| Mode toggle (tap FAB) | [ ] | [ ] |
| Swipe right = approve | [ ] | n/a |
| Swipe left = reject | [ ] | n/a |
| Keyboard shortcuts | n/a | [ ] |
| Popup opens | [ ] | [ ] |
| Popup shows counts | [ ] | [ ] |
| Import accounts | [ ] | [ ] |
| Export accounts | [ ] | [ ] |
| Clear all | [ ] | [ ] |
| Stats panel (long-press FAB) | [ ] | [ ] |
| Auto-advance | [ ] | [ ] |
| UI hiding | [ ] | [ ] |

### Differences from Chrome Extension

| Aspect | Chrome | Safari |
|--------|--------|--------|
| Storage | `chrome.storage.local` | `localStorage` only |
| Script injection | `chrome.scripting.executeScript` | Not available |
| Communication | Direct + storage | `browser.tabs.sendMessage` only |
| Popup | Can access storage directly | Must message content script |
| Distribution | Chrome Web Store | App Store (requires Xcode) |

### Troubleshooting

**"safari-web-extension-converter not found"**
- Install full Xcode (not just Command Line Tools)
- Run: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

**Popup shows "Open Instagram Reels first"**
- Content script only loads on /reels pages
- Navigate to instagram.com/reels in Safari

**Extension not appearing in Safari**
- Check Safari → Settings → Extensions
- Make sure extension is enabled
- Allow for instagram.com domain

**Icons look wrong**
- Re-run: `/opt/homebrew/bin/python3.11 generate_icons.py`
- Requires Pillow: `pip3 install pillow`

### File Modification Notes

**To update InstaPump logic:**
1. Edit `content.js` directly (it's the full embedded userscript)
2. Message listener is at the end (lines 2597-2677)
3. Version is at line 13: `const VERSION = '1.0.0';`

**To update popup UI:**
1. Edit `popup/popup.html` for structure
2. Edit `popup/popup.css` for styling
3. Edit `popup/popup.js` for logic

**To regenerate icons:**
```bash
cd repo/safari-extension/instapump-appstore
/opt/homebrew/bin/python3.11 generate_icons.py
```

### App Store Submission (Future)

1. Archive in Xcode: Product → Archive
2. Distribute: Window → Organizer → Distribute App
3. App Store Connect:
   - Create app listing
   - Upload screenshots (iPhone 6.5", iPad 12.9", Mac)
   - Fill metadata, privacy policy
   - Submit for review
