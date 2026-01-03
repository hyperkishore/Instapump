# Changelog

All notable changes to InstaPump will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
### Changed
### Fixed
### Removed

---

## [2.1.71] - 2026-01-03

### Added
- **Feature Flags System** - Enable/disable features without code changes
- **CSS Module Separation** - Split into BASE_CSS, HIDE_CSS, UI_CSS
- **Automated Test Suite** - Jest unit tests + Playwright E2E tests
- **CHANGELOG.md** - This file for tracking changes

### Changed
- CSS is now built dynamically based on feature flags
- Hiding toggle now properly disables/enables CSS stylesheet
- InstaPump UI CSS moved to separate UI_CSS (always active)

### Fixed
- **Critical**: Hiding toggle no longer hides InstaPump UI
- Video centering now feature-flagged for easy rollback

### Technical Details
- `FEATURES` object controls all toggleable features
- `buildBaseCSS()` and `buildHideCSS()` generate CSS dynamically
- Three separate stylesheets: `instapump-base-css`, `instapump-ui-css`, `instapump-hide-css`

---

## [2.1.70] - 2026-01-03

### Added
- CSS split into BASE_CSS and HIDE_CSS

### Fixed
- Hiding toggle now disables CSS stylesheet

### Side Effects
- **BUG**: InstaPump UI was in HIDE_CSS, disappeared when hiding OFF (fixed in 2.1.71)

---

## [2.1.69] - 2026-01-03

### Added
- Video vertical centering via CSS transform

### Changed
- Video now centered with `top: 50%; transform: translateY(-50%)`

### How to Verify
1. Open Instagram Reels
2. Check video has equal gaps top and bottom
3. Red debug border should be visible around video

---

## [2.1.68] - 2026-01-03

### Added
- Debug red border around video element for diagnostics

### How to Verify
1. Open Instagram Reels
2. Video should have 3px red border

---

## [2.1.67] - 2026-01-03

### Added
- Hide Instagram Messages/DM button on desktop web

### Changed
- CSS selector: `div:has(> div > svg[aria-label="Messages"])`

### Side Effects
- None expected - desktop-only element

---

## [2.1.66] - 2026-01-03

### Fixed
- **Hotfix**: Removed flexbox CSS that broke video display

### What Broke in 2.1.64
- Adding `display: flex` to clipsoverlay hid the video completely

---

## [2.1.65] - 2026-01-03

### Changed
- Scroll up now uses `block: 'center'` for better iOS reliability
- Added fallback scroll if `scrollIntoView` doesn't work

---

## [2.1.64] - 2026-01-03

### Added
- Flexbox centering attempt on clipsoverlay

### Side Effects
- **BUG**: Video disappeared completely (fixed in 2.1.66)

---

## [2.1.63] - 2026-01-03

### Fixed
- FAB position moved from `bottom: 100px` to `bottom: 160px`
- Removed aggressive video CSS that hid video on iOS

### What Was Removed
```css
/* BROKE iOS - video invisible */
video { width: 100vw; height: 100dvh; object-fit: cover; }
main * { background-color: black; }
```

---

## [2.1.62] - 2026-01-03

### Fixed
- Auto-advance premature skipping with timestamp validation
- Added 2000ms threshold to detect stale `wasNearEnd` flags

### How It Works
1. When video reaches 98%, record timestamp
2. On loop detection (seeking + wasNearEnd), check timestamp age
3. If timestamp < 2000ms old, advance; otherwise ignore

---

## Key Learnings

### CSS Rules to NEVER Use
- `display: flex` on clipsoverlay - Breaks Instagram's video layout
- `video { width: 100vw; height: 100dvh }` - Hides video on iOS
- `main * { background-color }` - Too broad, affects video

### Safe CSS Patterns
- Use `position: relative` + `transform` for centering
- Target specific elements, not wildcards
- Keep InstaPump UI in separate stylesheet

---

## Version Naming Convention

- **Major.Minor.Patch** (e.g., 2.1.71)
- Increment patch for bug fixes
- Increment minor for new features
- Increment major for breaking changes

## Commit Message Format

```
type: Short description

Longer description if needed.

What changed:
- Bullet points of changes

What could break:
- Potential side effects

How to verify:
- Manual test steps
```
