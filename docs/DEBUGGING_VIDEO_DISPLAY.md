# Building a Clean Instagram Reels Experience

This document explains the systematic approach to create a distraction-free, full-screen Instagram Reels viewer by identifying and eliminating unnecessary UI elements.

---

## Philosophy: Elimination Over Expansion

The key principle is **removing constraints rather than forcing expansion**.

❌ **Wrong approach**: Use JavaScript to forcibly expand video containers
```javascript
// Don't do this
element.style.width = '100vw';
element.style.height = '100vh';
```

✅ **Right approach**: Identify and hide/remove the UI elements causing constraints
```css
/* Hide the element that's constraining the video */
.constraining-element {
  display: none !important;
}
```

Instagram's video already wants to be full-screen. Our job is to remove what's blocking it.

---

## Part 1: Understanding Instagram's UI Structure

### What Instagram Shows by Default

```
┌─────────────────────────────────────────┐
│  [Logo]              [Icons: DM, etc]   │  ← Header
├─────────────────────────────────────────┤
│                                         │
│        ┌───────────────────┐            │
│        │                   │  [Like]    │
│        │                   │  [Comment] │  ← Side buttons
│        │     VIDEO         │  [Share]   │
│        │    (368x654)      │  [Save]    │
│        │                   │  [More]    │
│        │                   │            │
│        └───────────────────┘            │
│        @username · Follow               │  ← Bottom overlay
│        Caption text...                  │
│        ♫ Audio name                     │
├─────────────────────────────────────────┤
│  [Home] [Search] [Reels] [Shop] [Profile]│  ← Bottom nav
└─────────────────────────────────────────┘
```

### What We Want

```
┌─────────────────────────────────────────┐
│ @username              [DISCOVERY]      │  ← Our minimal overlay
│                                         │
│                                         │
│                                         │
│              FULL SCREEN                │
│                VIDEO                    │
│             (504x761)                   │
│                                         │
│                                         │
│                                         │
│                              [+] [-] [M]│  ← Our control buttons
└─────────────────────────────────────────┘
```

---

## Part 2: Identifying Elements to Remove

### Step 1: Use Browser DevTools to Explore

Open Instagram Reels and use the Element Inspector (F12) to explore the DOM structure.

### Step 2: Identify UI Categories

Group elements by their purpose:

| Category | What to Look For | Action |
|----------|------------------|--------|
| Navigation | `[role="tablist"]`, `nav[role="navigation"]` | Hide |
| Side buttons | Like, comment, share icons on right side | Hide |
| Bottom overlay | Username, caption, audio info | Selectively hide |
| Header | Logo, DM icons | Hide |
| Video container | `<video>` and parent divs | Remove constraints |

### Step 3: Find Elements by Role and Structure

```javascript
// Find navigation elements
document.querySelectorAll('[role="tablist"]');
document.querySelectorAll('nav[role="navigation"]');

// Find the main content area
document.querySelector('[role="main"]');
document.querySelector('[role="feed"]');

// Find video containers
document.querySelectorAll('[role="presentation"]');
```

### Step 4: Identify by Visual Inspection

Use this script to highlight elements and see what they are:

```javascript
// Highlight all major structural elements
function highlightStructure() {
  const colors = ['red', 'blue', 'green', 'orange', 'purple'];
  let i = 0;

  document.querySelectorAll('[role]').forEach(el => {
    const role = el.getAttribute('role');
    el.style.outline = `3px solid ${colors[i % colors.length]}`;
    console.log(`${colors[i % colors.length]}: role="${role}"`, el);
    i++;
  });
}
highlightStructure();
```

---

## Part 3: The Filtering Process

### Layer 1: Hide Navigation

```css
/* Hide bottom navigation bar */
div[role="tablist"],
nav[role="navigation"] {
  display: none !important;
  height: 0 !important;
  visibility: hidden !important;
}
```

**How we found this:**
1. Inspected the bottom nav bar in DevTools
2. Found it uses `role="tablist"` for accessibility
3. Using role selector is stable (won't change with class name updates)

### Layer 2: Hide Side Interaction Buttons

```css
/* Hide interaction buttons panel */
div.x1g9anri.x78zum5.xvs91rp.xmix8c7.xd4r4e8.x6ikm8r.x10wlt62.x1i0vuye {
  display: none !important;
  visibility: hidden !important;
}
```

**How we found this:**
1. Right-clicked on the like/comment/share buttons
2. Inspected parent container
3. Copied the class combination that's unique to this panel

**Finding unique class combinations:**
```javascript
// Get classes of an element and its siblings to find unique identifiers
function getUniqueSelector(element) {
  const classes = element.className.split(' ');
  const parent = element.parentElement;
  const siblings = parent ? Array.from(parent.children) : [];

  // Find classes that only this element has
  const uniqueClasses = classes.filter(cls => {
    return siblings.filter(sib => sib.classList.contains(cls)).length === 1;
  });

  console.log('All classes:', classes);
  console.log('Unique classes:', uniqueClasses);
  return uniqueClasses.join('.');
}
```

### Layer 3: Hide Bottom Overlay (Captions, Audio)

```css
/* Hide bottom overlay */
div.x1diwwjn.x1247r65.x13a6bvl {
  display: none !important;
  visibility: hidden !important;
}
```

### Layer 4: Hide Profile Images

```css
/* Hide profile images in reels */
article img {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
}
```

---

## Part 4: Removing Video Constraints

After hiding UI elements, the video still won't fill the screen because Instagram applies CSS constraints.

### Step 1: Find the Visible Video

Instagram pre-loads ~15 videos for smooth scrolling. Find the one on screen:

```javascript
function getVisibleVideo() {
  const videos = Array.from(document.querySelectorAll('video'));
  const centerY = window.innerHeight / 2;
  let visibleVideo = null;
  let minDist = Infinity;

  videos.forEach(v => {
    const r = v.getBoundingClientRect();
    const vidCenter = r.top + r.height / 2;
    const dist = Math.abs(vidCenter - centerY);
    if (dist < minDist && r.bottom > 0 && r.top < window.innerHeight) {
      minDist = dist;
      visibleVideo = v;
    }
  });

  return visibleVideo;
}
```

### Step 2: Measure the Constraint

```javascript
const video = getVisibleVideo();
const vr = video.getBoundingClientRect();

console.log({
  viewport: { width: window.innerWidth, height: window.innerHeight },
  video: {
    width: Math.round(vr.width),
    height: Math.round(vr.height),
    left: Math.round(vr.left)
  },
  gap: {
    width: window.innerWidth - Math.round(vr.width),
    height: window.innerHeight - Math.round(vr.height)
  }
});
```

**Example output:**
```
viewport: { width: 504, height: 761 }
video:    { width: 504, height: 761, left: 68 }  // Video is full size but offset!
```

### Step 3: Trace the Constraint Source

Walk up the DOM to find which parent is constraining:

```javascript
function traceConstraints(video) {
  let el = video;
  const chain = [];

  while (el && el !== document.body) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);

    chain.push({
      tag: el.tagName,
      classes: el.className?.split(' ').slice(0, 3).join(' '),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      overflow: style.overflow
    });

    el = el.parentElement;
  }

  console.table(chain);
  return chain;
}

traceConstraints(getVisibleVideo());
```

**Example output:**
```
Level | Tag   | Classes              | Width | Height | Overflow
------|-------|----------------------|-------|--------|----------
0     | VIDEO | x1lliihq x5yr21d     | 504   | 761    | visible
1     | DIV   | x5yr21d x1uhb9sk     | 368   | 654    | visible   ← CONSTRAINT
2     | DIV   | x5yr21d x1n2onr6     | 368   | 654    | visible
...
5     | DIV   | x1i5p2am x1whfx0g    | 368   | 654    | hidden    ← CLIPS
```

**Key findings:**
- Parent div at level 1 constrains to 368x654
- Parent at level 5 has `overflow: hidden` (causes clipping)

### Step 4: Find Specific Constraint

```javascript
function findWidthConstraint(video) {
  let el = video.parentElement;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    if (Math.round(rect.width) < window.innerWidth - 50) {
      return {
        element: el,
        classes: el.className,
        computedWidth: style.width,
        actualWidth: Math.round(rect.width)
      };
    }
    el = el.parentElement;
  }
  return null;
}

console.log(findWidthConstraint(getVisibleVideo()));
// { classes: "x5yr21d x1uhb9sk xh8yej3", computedWidth: "368px", ... }
```

### Step 5: Find Clipping Container

```javascript
function findClippingContainer(video) {
  let el = video.parentElement;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    if (style.overflow === 'hidden' && rect.height < window.innerHeight - 50) {
      return {
        element: el,
        classes: el.className?.split(' ').slice(0, 3).join(' '),
        height: Math.round(rect.height),
        overflow: style.overflow
      };
    }
    el = el.parentElement;
  }
  return null;
}

console.log(findClippingContainer(getVisibleVideo()));
// { classes: "x1i5p2am x1whfx0g xr2y4jy", height: 654, overflow: "hidden" }
```

---

## Part 5: The CSS Solution

### Why `:has()` Selectors?

Instagram uses obfuscated class names like `x5yr21d` that:
- Change frequently with updates
- Are shared across many unrelated elements
- Would require constant maintenance

The CSS `:has()` selector targets parents based on their children:

```css
/* "Select any div that has a video as a child/descendant" */
div:has(> video) { }
div:has(> div > video) { }
```

### The Complete Fix

```css
/* Remove Instagram's width and height constraints on video containers */
div:has(> video),
div:has(> div > video),
div:has(> div > div > video),
div:has(> div > div > div > video),
div:has(> div > div > div > div > video),
div:has(> div > div > div > div > div > video),
div:has(> div > div > div > div > div > div > video) {
  width: 100vw !important;
  max-width: 100vw !important;
  min-width: 100vw !important;
  height: 100vh !important;
  min-height: 100vh !important;
  max-height: 100vh !important;
  left: 0 !important;
  margin-left: 0 !important;
  overflow: visible !important;  /* Removes clipping */
}

video {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  object-fit: contain !important;  /* Maintain aspect ratio */
}
```

### Why Multiple Depth Levels?

Instagram nests videos 5-7 levels deep in divs. Each `:has()` rule targets a different depth:

```
div:has(> video)                           → Parent of video
div:has(> div > video)                     → Grandparent
div:has(> div > div > video)               → Great-grandparent
div:has(> div > div > div > video)         → 4 levels up
div:has(> div > div > div > div > video)   → 5 levels up
...
```

---

## Part 6: Verification

### Quick Check Function

```javascript
window.checkVideo = () => {
  const video = getVisibleVideo();
  const vr = video?.getBoundingClientRect();

  if (!vr) return 'No video found';

  return {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    video: `${Math.round(vr.width)}x${Math.round(vr.height)}`,
    position: `left:${Math.round(vr.left)} top:${Math.round(vr.top)}`,
    fullWidth: Math.round(vr.width) === window.innerWidth,
    fullHeight: Math.round(vr.height) === window.innerHeight,
    noClipping: vr.top >= -5 && vr.bottom <= window.innerHeight + 5
  };
};
```

**Expected output after fix:**
```javascript
checkVideo()
// {
//   viewport: "504x761",
//   video: "504x761",
//   position: "left:0 top:0",
//   fullWidth: true,
//   fullHeight: true,
//   noClipping: true
// }
```

### Full Verification Script

```javascript
function verifyFix() {
  const video = getVisibleVideo();
  if (!video) return { error: 'No video found' };

  const vr = video.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Check for any remaining overflow:hidden containers
  let el = video.parentElement;
  let clippingFound = null;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (style.overflow === 'hidden' && rect.height < vh - 20) {
      clippingFound = {
        classes: el.className?.split(' ').slice(0, 3).join(' '),
        height: Math.round(rect.height)
      };
      break;
    }
    el = el.parentElement;
  }

  return {
    dimensions: {
      viewport: `${vw}x${vh}`,
      video: `${Math.round(vr.width)}x${Math.round(vr.height)}`
    },
    checks: {
      fullWidth: Math.round(vr.width) >= vw - 5,
      fullHeight: Math.round(vr.height) >= vh - 5,
      noLeftOffset: Math.round(vr.left) <= 5,
      noClipping: !clippingFound
    },
    issues: clippingFound ? { clippingContainer: clippingFound } : null,
    allPassing: Math.round(vr.width) >= vw - 5 &&
                Math.round(vr.height) >= vh - 5 &&
                Math.round(vr.left) <= 5 &&
                !clippingFound
  };
}

console.log(verifyFix());
```

---

## Common Issues & Solutions

### Issue: Navigation icons blow up to full screen

**Cause**: CSS targeting too broad, affecting SVG icons

**Solution**: Use `:has()` which only targets containers with video children

### Issue: Video still has black bars

**Cause**: Not enough depth levels in `:has()` selectors

**Solution**: Add more levels:
```css
div:has(> div > div > div > div > div > div > div > video) { ... }
```

### Issue: Video cropped after scrolling

**Cause**: `overflow: hidden` on a parent not covered by CSS

**Debug**: Run `findClippingContainer()` and add that container to CSS

### Issue: Fix works then breaks after Instagram update

**Cause**: Instagram changed class names

**Solution**: The `:has()` approach should be immune to this. If it breaks, Instagram may have changed the DOM structure - re-run the tracing scripts.

---

## Summary: The Complete Approach

1. **Explore** - Use DevTools to understand Instagram's DOM structure
2. **Categorize** - Group UI elements by purpose (nav, buttons, overlays)
3. **Hide non-essential** - Use CSS to hide everything except video
4. **Trace constraints** - Find what's limiting video size
5. **Remove constraints** - Use `:has()` selectors to target video containers
6. **Verify** - Run check functions to confirm fix works
7. **Test across videos** - Scroll through multiple reels to ensure consistency

The key insight: Instagram's video already wants to be full-screen. We're not expanding it - we're removing what's blocking it.
