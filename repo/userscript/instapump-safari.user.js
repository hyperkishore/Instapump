// ==UserScript==
// @name         InstaPump - Clean Reels Experience
// @namespace    https://github.com/hyperkishore/Instapump
// @version      1.0.1
// @description  Full-screen Instagram Reels with hidden UI elements. Approve/reject accounts with swipe gestures or buttons.
// @author       InstaPump
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @icon         https://www.instagram.com/favicon.ico
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
  'use strict';

  // ==================== CSS Injection ====================

  const INSTAPUMP_CSS = `
/* InstaPump - Clean Reels Experience CSS */

/* Hide bottom navigation bar */
div[role="tablist"],
nav[role="navigation"] {
  display: none !important;
  height: 0 !important;
  visibility: hidden !important;
}

/* Black background */
body, html {
  background: black !important;
}

/* Scroll snap for reels */
html, body {
  scroll-snap-type: y mandatory !important;
  overflow-y: scroll !important;
  overflow-x: hidden !important;
  height: 100vh !important;
  max-height: 100vh !important;
  scrollbar-width: none !important;
}

html::-webkit-scrollbar, body::-webkit-scrollbar {
  display: none !important;
}

/* Remove Instagram's width and height constraints on video containers */
/* Use :has() to target any div that contains a video element */
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
  overflow: visible !important;
}

/* Video element itself */
video {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  object-fit: contain !important;
}

/* Each reel presentation should snap with gaps */
[role="presentation"] {
  scroll-snap-align: start !important;
  scroll-snap-stop: always !important;
  margin-bottom: 40px !important;
  margin-top: 20px !important;
  border-radius: 12px !important;
  overflow: visible !important;
  min-height: 100vh !important;
}

/* Hide any scrollbars */
*::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
}

* {
  scrollbar-width: none !important;
}

/* Main container scroll snap */
main, [role="main"], [role="feed"] {
  scroll-snap-type: y mandatory !important;
  height: 100vh !important;
  overflow-y: scroll !important;
  overflow-x: hidden !important;
}

/* Hide right side panel */
div.x1nhvcw1.x1oa3qoh.x6s0dn4.xqjyukv.x1q0g3np.x2lah0s.x1c4vz4f {
  display: none !important;
  visibility: hidden !important;
}

/* Hide interaction buttons panel */
div.x1g9anri.x78zum5.xvs91rp.xmix8c7.xd4r4e8.x6ikm8r.x10wlt62.x1i0vuye {
  display: none !important;
  visibility: hidden !important;
}

/* Hide bottom overlay */
div.x1diwwjn.x1247r65.x13a6bvl {
  display: none !important;
  visibility: hidden !important;
}

/* Hide side panel */
div.xuk3077.x1nhvcw1.xdt5ytf {
  display: none !important;
  visibility: hidden !important;
}

/* Hide right side buttons */
article div[style*="right"] {
  display: none !important;
}

/* Remove padding from wrapper divs */
div.xyamay9.x1l90r2v,
div.xl56j7k.x1l90r2v.xyamay9 {
  padding: 0 !important;
}

/* Hide canvas elements */
article canvas {
  display: none !important;
}

/* Hide profile images */
article img {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
}

img.xz74otr,
img.x5yr21d,
img.x1d8287x {
  display: none !important;
  visibility: hidden !important;
}

/* Hide additional UI overlays */
div.xuk3077.x1oa3qoh.x1nhvcw1,
div.xrok2fi.xz4gly6,
div.x5lhr3w.xeuugli {
  display: none !important;
  visibility: hidden !important;
}

/* ==================== InstaPump UI ==================== */

/* Control Panel - larger for touch */
#instapump-controls {
  position: fixed;
  bottom: 40px;
  right: 20px;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.instapump-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 28px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s;
  touch-action: manipulation;
}

.instapump-btn:active {
  transform: scale(0.9);
}

#instapump-approve {
  background: linear-gradient(135deg, #34c759, #30d158);
}

#instapump-reject {
  background: linear-gradient(135deg, #ff3b30, #ff453a);
}

/* Toast Notification */
#instapump-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.95);
  color: white;
  padding: 20px 40px;
  border-radius: 20px;
  font-size: 20px;
  font-weight: 600;
  z-index: 999999;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  text-align: center;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

#instapump-toast.visible {
  opacity: 1;
}

#instapump-toast.approved {
  background: rgba(52, 199, 89, 0.95);
  border: 2px solid #34c759;
}

#instapump-toast.rejected {
  background: rgba(255, 59, 48, 0.95);
  border: 2px solid #ff3b30;
}

/* Status Border */
#instapump-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 999998;
  border: 5px solid transparent;
  transition: border-color 0.3s;
}

#instapump-status.approved {
  border-color: #34c759;
}

#instapump-status.rejected {
  border-color: #ff3b30;
}

/* Username Display */
#instapump-username {
  position: fixed;
  top: 60px;
  left: 20px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 10px 18px;
  border-radius: 25px;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 999999;
  opacity: 0;
  transition: opacity 0.3s;
}

#instapump-username.visible {
  opacity: 1;
}

/* Mode Indicator */
#instapump-mode {
  position: fixed;
  top: 60px;
  right: 20px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 10px 18px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 999999;
  opacity: 0;
  transition: opacity 0.3s, background 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
}

#instapump-mode.visible {
  opacity: 1;
}

#instapump-mode.whitelist-mode {
  background: rgba(52, 199, 89, 0.9);
  color: white;
}

#instapump-mode.discovery-mode {
  background: rgba(255, 149, 0, 0.9);
  color: white;
}

/* Skip Counter */
#instapump-skip-counter {
  position: fixed;
  top: 110px;
  right: 20px;
  background: rgba(0,0,0,0.6);
  color: #888;
  padding: 8px 14px;
  border-radius: 18px;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 999999;
  opacity: 0;
  transition: opacity 0.3s;
}

#instapump-skip-counter.visible {
  opacity: 1;
}

/* Small Mode Toggle Button */
.instapump-btn-small {
  width: 45px !important;
  height: 45px !important;
  font-size: 16px !important;
  background: linear-gradient(135deg, #5856d6, #af52de) !important;
}

#instapump-mode-btn {
  background: linear-gradient(135deg, #5856d6, #af52de);
}

/* Swipe indicator */
#instapump-swipe-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 80px;
  z-index: 999999;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

#instapump-swipe-indicator.visible {
  opacity: 1;
}
`;

  // Inject CSS via style element (Safari compatible)
  function injectCSS() {
    const style = document.createElement('style');
    style.id = 'instapump-styles';
    style.textContent = INSTAPUMP_CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  // Inject CSS immediately
  injectCSS();

  // ==================== Main Script ====================

  // Only run on reels pages or redirect to reels
  if (!window.location.href.includes('/reels')) {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.location.href = 'https://www.instagram.com/reels/';
      return;
    }
    return; // Don't run on non-reels pages
  }

  // Storage keys
  const STORAGE_KEY_ALLOWLIST = 'instapump_allowlist';
  const STORAGE_KEY_BLOCKLIST = 'instapump_blocklist';
  const STORAGE_KEY_MODE = 'instapump_mode';

  // State
  let currentUsername = null;
  let initialized = false;
  let filterMode = 'whitelist';
  let skipCount = 0;
  let globalMuted = true;

  // Touch/swipe state
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const SWIPE_THRESHOLD = 80;

  // ==================== Storage Functions ====================

  function getAllowlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_ALLOWLIST)) || [];
    } catch (e) {
      return [];
    }
  }

  function getBlocklist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_BLOCKLIST)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveAllowlist(list) {
    localStorage.setItem(STORAGE_KEY_ALLOWLIST, JSON.stringify(list));
  }

  function saveBlocklist(list) {
    localStorage.setItem(STORAGE_KEY_BLOCKLIST, JSON.stringify(list));
  }

  function getFilterMode() {
    try {
      return localStorage.getItem(STORAGE_KEY_MODE) || 'whitelist';
    } catch (e) {
      return 'whitelist';
    }
  }

  function setFilterMode(mode) {
    filterMode = mode;
    localStorage.setItem(STORAGE_KEY_MODE, mode);
    updateModeIndicator();
    showToast(mode === 'whitelist' ? 'Whitelist-only mode' : 'Discovery mode');
  }

  function toggleFilterMode() {
    const newMode = filterMode === 'whitelist' ? 'discovery' : 'whitelist';
    setFilterMode(newMode);
  }

  // ==================== Username Detection ====================

  function detectUsername() {
    const systemPages = ['reels', 'explore', 'p', 'reel', 'direct', 'stories', 'accounts', 'about', 'settings', 'nametag', 'directory', 'legal', 'privacy', 'terms', 'session', 'emails', 'oauth', 'tags', 'locations', 'audio', 'api', 'developer', 'help', 'press', 'jobs', 'blog'];

    const presentations = Array.from(document.querySelectorAll('[role="presentation"]'));
    const viewportCenterY = window.innerHeight / 2;

    let visibleReel = null;
    let minDistance = Infinity;

    for (const pres of presentations) {
      const rect = pres.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(centerY - viewportCenterY);

      if (distance < minDistance) {
        minDistance = distance;
        visibleReel = pres;
      }
    }

    if (!visibleReel) return null;

    const links = visibleReel.querySelectorAll('a[href^="/"]');

    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href) continue;

      const reelsMatch = href.match(/^\/([a-zA-Z0-9._]+)\/reels\/?/);
      if (reelsMatch) {
        const username = reelsMatch[1].toLowerCase();
        if (!systemPages.includes(username)) {
          return username;
        }
      }
    }

    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href) continue;

      const match = href.match(/^\/([a-zA-Z0-9._]+)(?:\/|$)/);
      if (match) {
        const username = match[1].toLowerCase();
        if (!systemPages.includes(username) && username.length > 2) {
          return username;
        }
      }
    }

    return null;
  }

  // ==================== UI Functions ====================

  function showToast(message, type = 'default') {
    let toast = document.getElementById('instapump-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'instapump-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('approved', 'rejected');
    if (type === 'approved') {
      toast.classList.add('approved');
    } else if (type === 'rejected') {
      toast.classList.add('rejected');
    }
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.classList.remove('approved', 'rejected'), 200);
    }, 1500);
  }

  function showSwipeIndicator(direction) {
    let indicator = document.getElementById('instapump-swipe-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'instapump-swipe-indicator';
      document.body.appendChild(indicator);
    }
    indicator.textContent = direction === 'right' ? '✓' : '✗';
    indicator.style.color = direction === 'right' ? '#34c759' : '#ff3b30';
    indicator.classList.add('visible');
    setTimeout(() => indicator.classList.remove('visible'), 300);
  }

  function updateStatusBorder() {
    let status = document.getElementById('instapump-status');
    if (!status) {
      status = document.createElement('div');
      status.id = 'instapump-status';
      document.body.appendChild(status);
    }

    status.classList.remove('approved', 'rejected');

    if (!currentUsername) return;

    const allowlist = getAllowlist();
    const blocklist = getBlocklist();

    if (allowlist.includes(currentUsername)) {
      status.classList.add('approved');
    } else if (blocklist.includes(currentUsername)) {
      status.classList.add('rejected');
    }
  }

  function updateUsernameDisplay() {
    let display = document.getElementById('instapump-username');
    if (!display) {
      display = document.createElement('div');
      display.id = 'instapump-username';
      document.body.appendChild(display);
    }

    if (currentUsername) {
      display.textContent = '@' + currentUsername;
      display.classList.add('visible');
    } else {
      display.classList.remove('visible');
    }
  }

  function updateModeIndicator() {
    let indicator = document.getElementById('instapump-mode');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'instapump-mode';
      document.body.appendChild(indicator);
    }

    const allowlist = getAllowlist();
    if (filterMode === 'whitelist') {
      indicator.textContent = `WHITELIST (${allowlist.length})`;
      indicator.className = 'whitelist-mode';
    } else {
      indicator.textContent = 'DISCOVERY';
      indicator.className = 'discovery-mode';
    }
    indicator.classList.add('visible');
  }

  function updateSkipCounter() {
    let counter = document.getElementById('instapump-skip-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.id = 'instapump-skip-counter';
      document.body.appendChild(counter);
    }
    counter.textContent = `Skipped: ${skipCount}`;
    counter.classList.add('visible');
  }

  // ==================== Account Actions ====================

  function approveAccount() {
    if (!currentUsername) {
      showToast('No account detected');
      return;
    }

    const allowlist = getAllowlist();
    const blocklist = getBlocklist();

    if (!allowlist.includes(currentUsername)) {
      allowlist.push(currentUsername);
      saveAllowlist(allowlist);
    }

    const blockIdx = blocklist.indexOf(currentUsername);
    if (blockIdx > -1) {
      blocklist.splice(blockIdx, 1);
      saveBlocklist(blocklist);
    }

    showToast('Approved @' + currentUsername, 'approved');
    updateStatusBorder();
    updateModeIndicator();
  }

  function rejectAccount() {
    if (!currentUsername) {
      showToast('No account detected');
      return;
    }

    const allowlist = getAllowlist();
    const blocklist = getBlocklist();

    if (!blocklist.includes(currentUsername)) {
      blocklist.push(currentUsername);
      saveBlocklist(blocklist);
    }

    const allowIdx = allowlist.indexOf(currentUsername);
    if (allowIdx > -1) {
      allowlist.splice(allowIdx, 1);
      saveAllowlist(allowlist);
    }

    showToast('Rejected @' + currentUsername, 'rejected');
    updateStatusBorder();
    updateModeIndicator();
  }

  // ==================== Navigation ====================

  function navigateReel(direction) {
    const reels = Array.from(document.querySelectorAll('[role="presentation"]'));
    if (reels.length === 0) {
      window.scrollBy({
        top: direction === 'next' ? window.innerHeight : -window.innerHeight,
        behavior: 'smooth'
      });
      return;
    }

    let currentIdx = 0;
    let minDistance = Infinity;
    const viewportCenterY = window.innerHeight / 2;

    reels.forEach((reel, idx) => {
      const rect = reel.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(centerY - viewportCenterY);

      if (distance < minDistance) {
        minDistance = distance;
        currentIdx = idx;
      }
    });

    let targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    targetIdx = Math.max(0, Math.min(targetIdx, reels.length - 1));

    if (reels[targetIdx]) {
      reels[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ==================== Control Panel ====================

  function createControls() {
    if (document.getElementById('instapump-controls')) return;

    const controls = document.createElement('div');
    controls.id = 'instapump-controls';

    const modeBtn = document.createElement('button');
    modeBtn.id = 'instapump-mode-btn';
    modeBtn.className = 'instapump-btn instapump-btn-small';
    modeBtn.textContent = 'M';
    modeBtn.title = 'Toggle filter mode';
    modeBtn.addEventListener('click', toggleFilterMode);
    modeBtn.addEventListener('touchend', (e) => { e.preventDefault(); toggleFilterMode(); });

    const approveBtn = document.createElement('button');
    approveBtn.id = 'instapump-approve';
    approveBtn.className = 'instapump-btn';
    approveBtn.textContent = '+';
    approveBtn.title = 'Approve account';
    approveBtn.addEventListener('click', approveAccount);
    approveBtn.addEventListener('touchend', (e) => { e.preventDefault(); approveAccount(); });

    const rejectBtn = document.createElement('button');
    rejectBtn.id = 'instapump-reject';
    rejectBtn.className = 'instapump-btn';
    rejectBtn.textContent = '-';
    rejectBtn.title = 'Reject account';
    rejectBtn.addEventListener('click', rejectAccount);
    rejectBtn.addEventListener('touchend', (e) => { e.preventDefault(); rejectAccount(); });

    controls.appendChild(modeBtn);
    controls.appendChild(approveBtn);
    controls.appendChild(rejectBtn);
    document.body.appendChild(controls);

    const status = document.createElement('div');
    status.id = 'instapump-status';
    document.body.appendChild(status);

    const toast = document.createElement('div');
    toast.id = 'instapump-toast';
    document.body.appendChild(toast);

    const username = document.createElement('div');
    username.id = 'instapump-username';
    document.body.appendChild(username);
  }

  // ==================== Touch/Swipe Gestures ====================

  function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }

  function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }

  function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Only process horizontal swipes (not vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Swipe right = approve
        showSwipeIndicator('right');
        approveAccount();
      } else {
        // Swipe left = reject
        showSwipeIndicator('left');
        rejectAccount();
      }
    }
  }

  function setupTouchGestures() {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  // ==================== Keyboard Shortcuts (for iPad) ====================

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          e.stopPropagation();
          approveAccount();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          e.stopPropagation();
          rejectAccount();
          break;
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          e.stopPropagation();
          navigateReel('next');
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          e.stopPropagation();
          navigateReel('prev');
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          e.stopPropagation();
          toggleFilterMode();
          break;
        case ' ':
          e.preventDefault();
          e.stopPropagation();
          toggleMute();
          break;
      }
    }, true);
  }

  // ==================== Audio Control ====================

  function getVisibleVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    const centerY = window.innerHeight / 2;
    let bestVideo = null;
    let minDist = Infinity;

    videos.forEach(v => {
      const r = v.getBoundingClientRect();
      const vidCenter = r.top + r.height / 2;
      const dist = Math.abs(vidCenter - centerY);
      if (dist < minDist && r.bottom > 0 && r.top < window.innerHeight) {
        minDist = dist;
        bestVideo = v;
      }
    });
    return bestVideo;
  }

  function toggleMute() {
    globalMuted = !globalMuted;
    showToast(globalMuted ? 'Muted' : 'Unmuted');
    syncVideoAudio();
  }

  function syncVideoAudio() {
    const video = getVisibleVideo();
    if (video) {
      video.muted = globalMuted;
      video.volume = 1;
      if (!globalMuted && video.paused) {
        video.play().catch(() => {});
      }
    }
  }

  // ==================== Polling & Auto-Skip ====================

  function pollAndFilter() {
    const username = detectUsername();

    syncVideoAudio();

    if (username && username !== currentUsername) {
      currentUsername = username;
      updateStatusBorder();
      updateUsernameDisplay();

      const allowlist = getAllowlist();
      const blocklist = getBlocklist();

      if (filterMode === 'whitelist') {
        if (!allowlist.includes(username)) {
          skipCount++;
          updateSkipCounter();
          setTimeout(() => navigateReel('next'), 150);
          return;
        }
      } else {
        if (blocklist.includes(username)) {
          showToast('Skipping blocked @' + username);
          skipCount++;
          updateSkipCounter();
          setTimeout(() => navigateReel('next'), 300);
          return;
        }
      }
    }
  }

  // ==================== Initialization ====================

  function init() {
    if (initialized) return;
    initialized = true;

    console.log('[InstaPump] Initializing for Safari...');

    filterMode = getFilterMode();

    createControls();
    setupKeyboardShortcuts();
    setupTouchGestures();
    updateModeIndicator();
    updateSkipCounter();

    setInterval(pollAndFilter, 500);

    const allowlist = getAllowlist();
    console.log(`[InstaPump] Loaded in ${filterMode} mode. ${allowlist.length} accounts in whitelist.`);
    console.log('[InstaPump] Swipe right=approve, left=reject. Buttons at bottom right.');
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', init);

  // ==================== API ====================

  window.instapump = {
    approve: approveAccount,
    reject: rejectAccount,
    next: () => navigateReel('next'),
    prev: () => navigateReel('prev'),
    getAllowlist,
    getBlocklist,
    getMode: () => filterMode,
    setMode: setFilterMode,
    toggleMode: toggleFilterMode,

    importAccounts: (accounts) => {
      if (!Array.isArray(accounts)) {
        accounts = accounts.split(/[\n,\s]+/).map(a => a.trim().toLowerCase().replace('@', ''));
      }
      accounts = accounts.filter(a => a.length > 0);
      const allowlist = getAllowlist();
      let added = 0;
      accounts.forEach(account => {
        if (!allowlist.includes(account)) {
          allowlist.push(account);
          added++;
        }
      });
      saveAllowlist(allowlist);
      updateModeIndicator();
      showToast(`Imported ${added} accounts (${allowlist.length} total)`);
      return { added, total: allowlist.length };
    },

    exportAccounts: () => {
      return getAllowlist().join('\n');
    },

    clearLists: () => {
      localStorage.removeItem(STORAGE_KEY_ALLOWLIST);
      localStorage.removeItem(STORAGE_KEY_BLOCKLIST);
      skipCount = 0;
      updateModeIndicator();
      updateSkipCounter();
      showToast('Lists cleared');
    },

    getUsername: () => currentUsername,
    getSkipCount: () => skipCount,
    resetSkipCount: () => { skipCount = 0; updateSkipCounter(); }
  };

})();
