// ==UserScript==
// @name         InstaPump - Clean Reels Experience
// @namespace    https://instapump.app
// @version      2.0.0
// @description  Full-screen Instagram Reels with filtering, swipe gestures, and element picker
// @author       InstaPump
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  // Only run on reels pages
  if (!window.location.href.includes('/reels')) {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.location.href = 'https://www.instagram.com/reels/';
      return;
    }
  }

  // Storage keys
  const STORAGE_KEY_ALLOWLIST = 'instapump_allowlist';
  const STORAGE_KEY_BLOCKLIST = 'instapump_blocklist';
  const STORAGE_KEY_MODE = 'instapump_mode';
  const STORAGE_KEY_SELECTORS = 'instapump_selectors';

  // State
  let currentUsername = null;
  let currentMode = localStorage.getItem(STORAGE_KEY_MODE) || 'discovery';
  let fabMenuOpen = false;
  let pickerActive = false;
  let logsVisible = false;
  const logs = [];

  // CSS
  const HIDE_CSS = `
    /* Hide bottom navigation bar */
    div[role="tablist"],
    nav[role="navigation"] {
      display: none !important;
      height: 0 !important;
      visibility: hidden !important;
    }

    /* Hide music/audio elements */
    a[href*="/audio/"],
    a[href*="/music/"] {
      display: none !important;
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

    /* Each reel/article should snap and fill viewport */
    article {
      scroll-snap-align: start !important;
      scroll-snap-stop: always !important;
      height: 100vh !important;
      min-height: 100vh !important;
      max-height: 100vh !important;
      overflow: hidden !important;
      width: 100vw !important;
    }

    /* Video fills the article */
    video {
      width: 100vw !important;
      height: 100vh !important;
      object-fit: cover !important;
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

    /* Hide various UI panels */
    div.x1nhvcw1.x1oa3qoh.x6s0dn4.xqjyukv.x1q0g3np.x2lah0s.x1c4vz4f,
    div.x1g9anri.x78zum5.xvs91rp.xmix8c7.xd4r4e8.x6ikm8r.x10wlt62.x1i0vuye,
    div.x1diwwjn.x1247r65.x13a6bvl,
    div.xuk3077.x1nhvcw1.xdt5ytf,
    div.xuk3077.x1oa3qoh.x1nhvcw1,
    div.xrok2fi.xz4gly6,
    div.x5lhr3w.xeuugli {
      display: none !important;
      visibility: hidden !important;
    }

    /* Hide all UI overlays */
    article div[style*="right"] {
      display: none !important;
    }

    /* Hide bottom overlays */
    article > div > div > div:not(.x1ej3kyw) {
      visibility: hidden !important;
    }

    /* Keep video container visible */
    div.x1ej3kyw.x1ey2m1c.x78zum5.xdt5ytf.xtijo5x {
      visibility: visible !important;
      display: block !important;
    }

    /* Remove padding from wrapper divs */
    div.xyamay9.x1l90r2v,
    div.xl56j7k.x1l90r2v.xyamay9 {
      padding: 0 !important;
    }

    /* Hide spans and links */
    article span[dir="auto"],
    article a[role="link"]:not([href*="/reels/"]) {
      visibility: hidden !important;
    }

    /* Hide SVG, canvas, images */
    article svg,
    article canvas,
    article img {
      display: none !important;
      visibility: hidden !important;
    }

    /* ==================== InstaPump UI ==================== */

    /* Status border */
    #instapump-status {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 999998;
      border: 4px solid transparent;
      transition: border-color 0.3s;
    }
    #instapump-status.approved { border-color: #34c759; }
    #instapump-status.rejected { border-color: #ff3b30; }

    /* FAB Container */
    #instapump-fab {
      position: fixed;
      bottom: 100px;
      right: 16px;
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      gap: 12px;
      z-index: 999999;
    }

    /* Main FAB */
    #instapump-fab-main {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 20px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: transform 0.2s, background 0.3s;
      -webkit-tap-highlight-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #instapump-fab-main:active { transform: scale(0.95); }
    #instapump-fab-main.discovery { background: linear-gradient(135deg, #007aff, #5856d6); }
    #instapump-fab-main.whitelist { background: linear-gradient(135deg, #34c759, #30d158); }

    /* FAB Menu */
    #instapump-fab-menu {
      display: flex;
      flex-direction: column;
      gap: 10px;
      opacity: 0;
      transform: translateY(20px);
      pointer-events: none;
      transition: opacity 0.2s, transform 0.2s;
    }
    #instapump-fab-menu.open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .instapump-fab-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: transform 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .instapump-fab-btn:active { transform: scale(0.9); }
    #instapump-btn-picker { background: linear-gradient(135deg, #ff9500, #ff3b30); }
    #instapump-btn-logs { background: linear-gradient(135deg, #5856d6, #af52de); }

    /* Toast */
    #instapump-toast {
      position: fixed;
      bottom: 200px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #instapump-toast.visible { opacity: 1; }

    /* Swipe indicator */
    #instapump-swipe {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 80px;
      opacity: 0;
      pointer-events: none;
      z-index: 999999;
      transition: opacity 0.15s;
      text-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    #instapump-swipe.show { opacity: 1; }
    #instapump-swipe.approve { color: #34c759; }
    #instapump-swipe.reject { color: #ff3b30; }

    /* Logs panel */
    #instapump-logs {
      position: fixed;
      top: 0; left: 0; right: 0;
      max-height: 40%;
      background: rgba(0,0,0,0.95);
      color: #0f0;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 11px;
      padding: 10px;
      overflow-y: auto;
      z-index: 1000000;
      display: none;
      border-bottom: 2px solid #333;
    }
    #instapump-logs.visible { display: block; }
    #instapump-logs .log-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #444;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      color: white;
    }
    #instapump-logs .log-entry {
      padding: 2px 0;
      border-bottom: 1px solid #222;
    }
    #instapump-logs button {
      background: #333;
      color: white;
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      margin-left: 6px;
    }
    #instapump-logs button:hover { background: #555; }

    /* Picker overlay */
    #instapump-picker-overlay {
      position: fixed;
      pointer-events: none;
      background: rgba(255,149,0,0.3);
      border: 2px solid #ff9500;
      z-index: 999997;
      display: none;
      border-radius: 4px;
    }
  `;

  // Inject CSS
  function injectCSS() {
    if (document.getElementById('instapump-css')) return;
    const style = document.createElement('style');
    style.id = 'instapump-css';
    style.textContent = HIDE_CSS;
    (document.head || document.documentElement).appendChild(style);
  }
  injectCSS();

  // Storage helpers
  function getAllowlist() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_ALLOWLIST)) || []; }
    catch { return []; }
  }
  function getBlocklist() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_BLOCKLIST)) || []; }
    catch { return []; }
  }
  function getSavedSelectors() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SELECTORS)) || []; }
    catch { return []; }
  }
  function saveAllowlist(list) { localStorage.setItem(STORAGE_KEY_ALLOWLIST, JSON.stringify(list)); }
  function saveBlocklist(list) { localStorage.setItem(STORAGE_KEY_BLOCKLIST, JSON.stringify(list)); }
  function saveMode(mode) { localStorage.setItem(STORAGE_KEY_MODE, mode); }
  function saveSavedSelectors(list) { localStorage.setItem(STORAGE_KEY_SELECTORS, JSON.stringify(list)); }

  // Logging
  function log(msg) {
    const timestamp = new Date().toLocaleTimeString();
    logs.push(`[${timestamp}] ${msg}`);
    if (logs.length > 200) logs.shift();
    updateLogsDisplay();
    console.log('[InstaPump]', msg);
  }

  function updateLogsDisplay() {
    const content = document.getElementById('instapump-logs-content');
    if (!content || !logsVisible) return;
    content.innerHTML = logs.map(l => `<div class="log-entry">${l}</div>`).join('');
    content.scrollTop = content.scrollHeight;
  }

  // Toast
  function showToast(message) {
    let toast = document.getElementById('instapump-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
    log(message);
  }

  // Swipe indicator
  function showSwipeIndicator(direction) {
    const indicator = document.getElementById('instapump-swipe');
    if (!indicator) return;
    indicator.textContent = direction === 'approve' ? '✓' : '✗';
    indicator.classList.remove('approve', 'reject');
    indicator.classList.add(direction, 'show');
    setTimeout(() => indicator.classList.remove('show'), 300);
  }

  // Status border
  function updateStatusBorder() {
    const status = document.getElementById('instapump-status');
    if (!status) return;
    status.classList.remove('approved', 'rejected');
    if (!currentUsername) return;
    if (getAllowlist().includes(currentUsername)) {
      status.classList.add('approved');
    } else if (getBlocklist().includes(currentUsername)) {
      status.classList.add('rejected');
    }
  }

  // Mode toggle
  function toggleMode() {
    currentMode = currentMode === 'discovery' ? 'whitelist' : 'discovery';
    saveMode(currentMode);
    updateModeUI();
    showToast(currentMode === 'discovery' ? 'Discovery Mode' : 'Whitelist Mode');
  }

  function updateModeUI() {
    const fab = document.getElementById('instapump-fab-main');
    if (!fab) return;
    fab.classList.remove('discovery', 'whitelist');
    fab.classList.add(currentMode);
    fab.textContent = currentMode === 'discovery' ? 'D' : 'W';
  }

  // FAB menu
  function toggleFabMenu() {
    fabMenuOpen = !fabMenuOpen;
    const menu = document.getElementById('instapump-fab-menu');
    if (menu) menu.classList.toggle('open', fabMenuOpen);
  }

  function closeFabMenu() {
    fabMenuOpen = false;
    const menu = document.getElementById('instapump-fab-menu');
    if (menu) menu.classList.remove('open');
  }

  // Username detection
  function detectUsername() {
    const links = document.querySelectorAll('a[href^="/"]');
    for (const link of links) {
      const rect = link.getBoundingClientRect();
      if (rect.top > 0 && rect.top < 150 && rect.left < 200) {
        const match = link.href.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?$/);
        if (match && !['reels', 'explore', 'p', 'reel', 'direct', 'stories'].includes(match[1])) {
          return match[1].toLowerCase();
        }
      }
    }
    return null;
  }

  // Account actions
  function approveAccount() {
    if (!currentUsername) return showToast('No account detected');
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
    showToast('Approved @' + currentUsername);
    updateStatusBorder();
  }

  function rejectAccount() {
    if (!currentUsername) return showToast('No account detected');
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
    showToast('Rejected @' + currentUsername);
    updateStatusBorder();
  }

  // Navigation
  function navigateReel(direction) {
    const articles = Array.from(document.querySelectorAll('article'));
    if (articles.length === 0) return;
    let currentIdx = 0;
    let maxVisible = 0;
    articles.forEach((article, idx) => {
      const rect = article.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (visibleHeight > maxVisible) {
        maxVisible = visibleHeight;
        currentIdx = idx;
      }
    });
    let targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    targetIdx = Math.max(0, Math.min(targetIdx, articles.length - 1));
    if (articles[targetIdx]) {
      articles[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Mode filtering
  function applyModeFilter(username) {
    if (currentMode === 'discovery') {
      if (getBlocklist().includes(username)) {
        showToast('Skipping @' + username);
        setTimeout(() => navigateReel('next'), 300);
      }
    } else {
      if (!getAllowlist().includes(username)) {
        showToast('Not whitelisted: @' + username);
        setTimeout(() => navigateReel('next'), 300);
      }
    }
  }

  // Hide elements
  function hideElements() {
    document.querySelectorAll('div[role="tablist"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
      if (el.parentElement) el.parentElement.style.setProperty('display', 'none', 'important');
    });
    document.querySelectorAll('video').forEach(video => {
      video.style.setProperty('width', '100vw', 'important');
      video.style.setProperty('height', '100vh', 'important');
      video.style.setProperty('object-fit', 'cover', 'important');
    });
    // Apply saved selectors
    getSavedSelectors().forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          el.style.setProperty('display', 'none', 'important');
        });
      } catch {}
    });
  }

  // Element picker
  function togglePicker() {
    pickerActive = !pickerActive;
    const overlay = document.getElementById('instapump-picker-overlay');
    if (!pickerActive) {
      if (overlay) overlay.style.display = 'none';
      document.removeEventListener('mousemove', pickerMouseMove);
      document.removeEventListener('click', pickerClick, true);
      showToast('Picker OFF');
    } else {
      document.addEventListener('mousemove', pickerMouseMove);
      document.addEventListener('click', pickerClick, true);
      showToast('Picker ON - double-tap to save');
    }
  }

  let pickerLastEl = null;
  let pickerLastTap = 0;

  function pickerMouseMove(e) {
    if (!pickerActive) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const overlay = document.getElementById('instapump-picker-overlay');
    if (!el || !overlay || el.id?.startsWith('instapump')) return;
    const r = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = r.left + 'px';
    overlay.style.top = r.top + 'px';
    overlay.style.width = r.width + 'px';
    overlay.style.height = r.height + 'px';
    pickerLastEl = el;
  }

  function pickerClick(e) {
    if (!pickerActive || !pickerLastEl) return;
    if (e.target.id?.startsWith('instapump')) return;
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - pickerLastTap < 300) {
      // Double-tap - save selector
      const el = pickerLastEl;
      let selector = '';
      if (el.id) {
        selector = '#' + el.id;
      } else {
        const cls = (el.className || '').toString().trim();
        if (cls) {
          const classes = cls.split(/\s+/).filter(c => c && !c.startsWith('x')).slice(0, 3);
          if (classes.length) selector = el.tagName.toLowerCase() + '.' + classes.join('.');
        }
        if (!selector) selector = el.tagName.toLowerCase();
      }
      const selectors = getSavedSelectors();
      if (!selectors.includes(selector)) {
        selectors.push(selector);
        saveSavedSelectors(selectors);
        el.style.outline = '3px solid #34c759';
        showToast('Saved: ' + selector);
      }
      pickerLastTap = 0;
    } else {
      pickerLastTap = now;
    }
  }

  // Logs panel
  function showLogsPanel() {
    logsVisible = true;
    const panel = document.getElementById('instapump-logs');
    if (panel) panel.classList.add('visible');
    updateLogsDisplay();
  }

  function hideLogsPanel() {
    logsVisible = false;
    const panel = document.getElementById('instapump-logs');
    if (panel) panel.classList.remove('visible');
  }

  // Create UI
  function createUI() {
    if (document.getElementById('instapump-fab')) return;

    // Status border
    const status = document.createElement('div');
    status.id = 'instapump-status';
    document.body.appendChild(status);

    // FAB container
    const fab = document.createElement('div');
    fab.id = 'instapump-fab';
    fab.innerHTML = `
      <button id="instapump-fab-main" class="${currentMode}">${currentMode === 'discovery' ? 'D' : 'W'}</button>
      <div id="instapump-fab-menu">
        <button class="instapump-fab-btn" id="instapump-btn-picker" title="Element Picker">✂</button>
        <button class="instapump-fab-btn" id="instapump-btn-logs" title="Logs">📋</button>
      </div>
    `;
    document.body.appendChild(fab);

    // Toast
    const toast = document.createElement('div');
    toast.id = 'instapump-toast';
    document.body.appendChild(toast);

    // Swipe indicator
    const swipe = document.createElement('div');
    swipe.id = 'instapump-swipe';
    document.body.appendChild(swipe);

    // Picker overlay
    const pickerOverlay = document.createElement('div');
    pickerOverlay.id = 'instapump-picker-overlay';
    document.body.appendChild(pickerOverlay);

    // Logs panel
    const logsPanel = document.createElement('div');
    logsPanel.id = 'instapump-logs';
    logsPanel.innerHTML = `
      <div class="log-header">
        <span>Debug Logs</span>
        <div>
          <button id="instapump-btn-copy">Copy</button>
          <button id="instapump-btn-clear">Clear</button>
          <button id="instapump-btn-close">Close</button>
        </div>
      </div>
      <div id="instapump-logs-content"></div>
    `;
    document.body.appendChild(logsPanel);

    // FAB interactions
    const fabMain = document.getElementById('instapump-fab-main');
    let fabPressTimer = null;
    let fabLongPressed = false;

    fabMain.addEventListener('pointerdown', () => {
      fabLongPressed = false;
      fabPressTimer = setTimeout(() => {
        fabLongPressed = true;
        toggleFabMenu();
      }, 400);
    });

    fabMain.addEventListener('pointerup', () => {
      clearTimeout(fabPressTimer);
      if (!fabLongPressed) toggleMode();
    });

    fabMain.addEventListener('pointerleave', () => clearTimeout(fabPressTimer));

    document.addEventListener('click', (e) => {
      if (fabMenuOpen && !e.target.closest('#instapump-fab')) closeFabMenu();
    });

    document.getElementById('instapump-btn-picker').addEventListener('click', () => {
      closeFabMenu();
      togglePicker();
    });

    document.getElementById('instapump-btn-logs').addEventListener('click', () => {
      closeFabMenu();
      showLogsPanel();
    });

    document.getElementById('instapump-btn-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(logs.join('\n'));
      showToast('Logs copied');
    });

    document.getElementById('instapump-btn-clear').addEventListener('click', () => {
      logs.length = 0;
      updateLogsDisplay();
    });

    document.getElementById('instapump-btn-close').addEventListener('click', hideLogsPanel);

    // Swipe gestures
    let swipeStartX = 0, swipeStartY = 0, swiping = false;
    const SWIPE_THRESHOLD = 80;

    document.addEventListener('mousedown', (e) => {
      if (e.target.closest('#instapump-fab, #instapump-logs')) return;
      swipeStartX = e.clientX;
      swipeStartY = e.clientY;
      swiping = true;
    });

    document.addEventListener('mouseup', (e) => {
      if (!swiping) return;
      swiping = false;
      const deltaX = e.clientX - swipeStartX;
      const deltaY = e.clientY - swipeStartY;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
        if (deltaX > 0) {
          showSwipeIndicator('approve');
          approveAccount();
        } else {
          showSwipeIndicator('reject');
          rejectAccount();
        }
      }
    });

    // Touch swipe support
    document.addEventListener('touchstart', (e) => {
      if (e.target.closest('#instapump-fab, #instapump-logs')) return;
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!swiping) return;
      swiping = false;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeStartX;
      const deltaY = touch.clientY - swipeStartY;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
        if (deltaX > 0) {
          showSwipeIndicator('approve');
          approveAccount();
        } else {
          showSwipeIndicator('reject');
          rejectAccount();
        }
      }
    }, { passive: true });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') { showSwipeIndicator('approve'); approveAccount(); }
    if (e.key === 'ArrowLeft') { showSwipeIndicator('reject'); rejectAccount(); }
    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); navigateReel('next'); }
    if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); navigateReel('prev'); }
    if (e.key === 'm' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleMode(); }
    if (e.key === 'p' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); togglePicker(); }
    if (e.key === 'l' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); logsVisible ? hideLogsPanel() : showLogsPanel(); }
  });

  // Polling
  function pollAndFilter() {
    const username = detectUsername();
    if (username && username !== currentUsername) {
      currentUsername = username;
      updateStatusBorder();
      applyModeFilter(username);
    }
  }

  // Init
  function init() {
    injectCSS();
    hideElements();
    createUI();
    const observer = new MutationObserver(hideElements);
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(pollAndFilter, 500);
    log('InstaPump v2.0.0 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => { init(); hideElements(); });

  // Debug API
  window.instapump = {
    approve: approveAccount,
    reject: rejectAccount,
    next: () => navigateReel('next'),
    prev: () => navigateReel('prev'),
    toggleMode,
    getAllowlist,
    getBlocklist,
    getSavedSelectors,
    clearLists: () => {
      localStorage.removeItem(STORAGE_KEY_ALLOWLIST);
      localStorage.removeItem(STORAGE_KEY_BLOCKLIST);
      showToast('Lists cleared');
    },
    clearSelectors: () => {
      localStorage.removeItem(STORAGE_KEY_SELECTORS);
      showToast('Selectors cleared');
    }
  };
})();
