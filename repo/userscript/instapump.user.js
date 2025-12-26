// ==UserScript==
// @name         InstaPump - Clean Reels Experience
// @namespace    https://instapump.app
// @version      2.1.20
// @description  Full-screen Instagram Reels with filtering, swipe gestures, and element picker
// @author       InstaPump
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  // TEST: Confirm script is loading
  console.log('🚀 INSTAPUMP 2.1.20 LOADING...');

  // Clear dangerous selectors on startup
  const FORBIDDEN_SELECTORS = ['div', 'main', 'body', 'html', 'article', 'section', 'span', 'a', 'button', 'div.html-div', 'video', 'img', 'svg', 'canvas'];
  try {
    let selectors = JSON.parse(localStorage.getItem('instapump_selectors')) || [];
    const originalCount = selectors.length;
    // Remove forbidden selectors and invalid ones
    selectors = selectors.filter(s => {
      const lower = s.toLowerCase();
      // Remove bare forbidden tags
      if (FORBIDDEN_SELECTORS.includes(lower)) return false;
      // Remove broken SVG selectors
      if (s.includes('[object')) return false;
      // Remove html-div selectors (too broad)
      if (s.includes('html-div')) return false;
      return true;
    });
    if (selectors.length !== originalCount) {
      console.log('⚠️ Cleaned up selectors, removed', originalCount - selectors.length);
      localStorage.setItem('instapump_selectors', JSON.stringify(selectors));
    }
  } catch {}


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
  let hidingEnabled = localStorage.getItem('instapump_hiding') !== 'false'; // Persist toggle state
  let tapInspectorActive = false; // Tap inspector mode
  const logs = [];

  // Session-only storage (resets on refresh)
  const sessionHiddenElements = []; // Array of {element, data} objects
  const sessionElementData = []; // JSON data for export

  // CSS - Carefully adding back UI hiding
  const HIDE_CSS = `
    /* Hide bottom navigation bar */
    div[role="tablist"],
    nav[role="navigation"] {
      display: none !important;
    }

    /* Black background */
    body, html {
      background: black !important;
    }

    /* Hide scrollbars */
    *::-webkit-scrollbar {
      display: none !important;
    }
    * {
      scrollbar-width: none !important;
    }

    /* Audio/Music links - NOT hidden to preserve video audio */

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

    /* Version badge */
    #instapump-version {
      position: fixed;
      top: 10px;
      right: 10px;
      color: white;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      opacity: 0.7;
      z-index: 999999;
      pointer-events: none;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    /* List count badge */
    #instapump-list-count {
      position: fixed;
      top: 26px;
      right: 10px;
      color: #34c759;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      opacity: 0.8;
      z-index: 999999;
      pointer-events: none;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    /* List viewer panel */
    #instapump-list-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      max-height: 70%;
      background: rgba(0,0,0,0.95);
      border-radius: 16px;
      z-index: 1000001;
      display: none;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #instapump-list-panel.visible { display: flex; }
    #instapump-list-panel .panel-header {
      padding: 16px;
      border-bottom: 1px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #instapump-list-panel .panel-header h3 {
      margin: 0;
      color: white;
      font-size: 16px;
    }
    #instapump-list-panel .panel-close {
      background: none;
      border: none;
      color: #888;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    #instapump-list-panel .panel-tabs {
      display: flex;
      border-bottom: 1px solid #333;
    }
    #instapump-list-panel .panel-tab {
      flex: 1;
      padding: 12px;
      background: none;
      border: none;
      color: #888;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    #instapump-list-panel .panel-tab.active {
      color: white;
      border-bottom: 2px solid #34c759;
    }
    #instapump-list-panel .panel-tab.blocked.active {
      border-bottom-color: #ff3b30;
    }
    #instapump-list-panel .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    #instapump-list-panel .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 4px;
      background: rgba(255,255,255,0.05);
    }
    #instapump-list-panel .list-item:hover {
      background: rgba(255,255,255,0.1);
    }
    #instapump-list-panel .list-item .username {
      color: white;
      font-size: 14px;
    }
    #instapump-list-panel .list-item .remove-btn {
      background: rgba(255,59,48,0.2);
      border: none;
      color: #ff3b30;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #instapump-list-panel .empty-message {
      color: #666;
      text-align: center;
      padding: 40px 20px;
      font-size: 13px;
    }

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
    const countEl = document.getElementById('instapump-pick-count');
    if (countEl) countEl.textContent = sessionElementData.length;
    if (!content || !logsVisible) return;
    // Escape HTML in log entries
    content.innerHTML = logs.map(l => `<div class="log-entry">${l.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`).join('');
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

  // Find the currently visible clips overlay (the main reel container)
  function getVisibleClipsOverlay() {
    const overlays = document.querySelectorAll('[id^="clipsoverlay"]');
    const vh = window.innerHeight;

    for (const overlay of overlays) {
      const rect = overlay.getBoundingClientRect();
      // Check if this overlay is mostly visible (covers > 50% of viewport)
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, vh);
      const visibleHeight = visibleBottom - visibleTop;

      if (visibleHeight > vh * 0.5) {
        return overlay;
      }
    }
    return null;
  }

  // Username detection - find username from visible reel's clips overlay
  function detectUsername() {
    const excludeNames = ['reels', 'explore', 'p', 'reel', 'direct', 'stories', 'accounts', 'about', 'audio', 'music', 'tags', 'locations'];

    // Find the visible clips overlay
    const overlay = getVisibleClipsOverlay();
    if (!overlay) return null;

    // Search WITHIN the clips overlay for the username link
    // The link has aria-label="username reels" format
    const link = overlay.querySelector('a[aria-label$=" reels"]');
    if (link) {
      const label = link.getAttribute('aria-label') || '';
      const match = label.match(/^([a-zA-Z0-9._]+)\s+reels$/i);
      if (match && !excludeNames.includes(match[1].toLowerCase())) {
        return match[1].toLowerCase();
      }
    }

    // Fallback: search for any username link within overlay
    const links = overlay.querySelectorAll('a[href^="/"]');
    for (const fallbackLink of links) {
      const href = fallbackLink.href || '';
      const match = href.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?$/);
      if (match && !excludeNames.includes(match[1])) {
        return match[1].toLowerCase();
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
    updateListCount();
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
    updateListCount();
  }

  // Auto-advance: track videos and move to next when finished
  const trackedVideos = new WeakSet();

  // Check if a video is the currently visible/active one
  function isVisibleVideo(video) {
    const rect = video.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // Check if video is mostly visible (covers significant portion of viewport)
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, vh);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    // Video should cover at least 50% of viewport height and be reasonably wide
    return visibleHeight > vh * 0.5 && rect.width > vw * 0.5;
  }

  function setupVideoAutoAdvance() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (trackedVideos.has(video)) return; // Already tracking
      trackedVideos.add(video);

      // When video ends, go to next (if this is the visible video)
      video.addEventListener('ended', () => {
        if (isVisibleVideo(video)) {
          log('Video ended event, advancing to next');
          setTimeout(() => navigateReel('next'), 300);
        }
      });

      // Detect video completion (works even if Instagram loops programmatically)
      video.addEventListener('timeupdate', () => {
        // Only process if video has valid duration
        if (!video.duration || video.duration === Infinity) return;

        const timeLeft = video.duration - video.currentTime;

        // When video is near the end (last 0.5 seconds)
        if (timeLeft < 0.5 && timeLeft >= 0 && video.currentTime > 1) {
          if (isVisibleVideo(video)) {
            // Only trigger once per play-through
            if (!video.dataset.advanceTriggered) {
              video.dataset.advanceTriggered = 'true';
              log(`Video near end (${video.currentTime.toFixed(1)}/${video.duration.toFixed(1)}), advancing`);
              setTimeout(() => navigateReel('next'), 500);
            }
          }
        }

        // Reset flag when video restarts (currentTime goes back to beginning)
        if (video.currentTime < 1 && video.dataset.advanceTriggered) {
          delete video.dataset.advanceTriggered;
        }
      });
    });
  }

  // Navigation - use clips overlays instead of articles
  function navigateReel(direction) {
    // Instagram Reels uses clips overlays, not articles
    const overlays = Array.from(document.querySelectorAll('[id^="clipsoverlay"]'));
    if (overlays.length === 0) {
      // Fallback: try scrolling by viewport height
      const scrollAmount = direction === 'next' ? window.innerHeight : -window.innerHeight;
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      return;
    }

    // Find the currently visible overlay
    let currentIdx = 0;
    let maxVisible = 0;
    const vh = window.innerHeight;

    overlays.forEach((overlay, idx) => {
      const rect = overlay.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, vh);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      if (visibleHeight > maxVisible) {
        maxVisible = visibleHeight;
        currentIdx = idx;
      }
    });

    // Navigate to next/prev
    let targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    targetIdx = Math.max(0, Math.min(targetIdx, overlays.length - 1));

    if (overlays[targetIdx] && targetIdx !== currentIdx) {
      overlays[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (direction === 'next') {
      // At the end, scroll down to trigger loading more
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
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

  // Element protection helpers
  function isInstaPumpElement(el) {
    return el.id?.startsWith('instapump') || el.closest('[id^="instapump"]');
  }

  function containsVideo(el) {
    return el.tagName === 'VIDEO' || el.querySelector('video') !== null;
  }

  function isVideoContainer(el) {
    // Check for known video container classes
    if (el.classList?.contains('x1ej3kyw')) return true;
    // Check if this element or parent has video
    if (containsVideo(el)) return true;
    return false;
  }

  function isClipsOverlay(el) {
    // Check if this element IS the clips overlay (not inside it)
    // The clips overlay has the tap listener for mute/unmute
    // We must NOT hide it, but we CAN hide elements inside it
    return el.id?.startsWith('clipsoverlay');
  }

  function safeHide(el) {
    if (!el || isInstaPumpElement(el) || isVideoContainer(el)) return false;
    // Don't hide the clips overlay itself (keeps tap-to-mute working)
    if (isClipsOverlay(el)) return false;
    // Don't hide elements that CONTAIN a clips overlay (parents of audio control)
    if (el.querySelector('[id^="clipsoverlay"]')) return false;
    el.style.setProperty('display', 'none', 'important');
    el.setAttribute('data-instapump-hidden', 'true'); // Mark for restore
    return true;
  }

  // Pattern-based hiding - works across all videos
  // Based on element analysis from 2025-12-25
  function hideElements() {
    // Skip if hiding is disabled (debug mode)
    if (!hidingEnabled) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Pattern 1: Bottom Navigation Bar
    // Stable: data-visualcompletion="ignore-dynamic" or contains "HomeExplore"
    document.querySelectorAll('[data-visualcompletion="ignore-dynamic"]').forEach(el => {
      safeHide(el);
    });
    document.querySelectorAll('div[role="tablist"]').forEach(el => {
      safeHide(el);
    });
    // Catch bottom nav by content and position
    document.querySelectorAll('div').forEach(el => {
      if (isInstaPumpElement(el) || isVideoContainer(el)) return;
      const text = el.textContent || '';
      const rect = el.getBoundingClientRect();
      if (text.includes('HomeExplore') &&
          rect.top > vh - 80 &&
          rect.width > vw * 0.8) {
        safeHide(el);
      }
    });

    // Pattern 2: Right-side action buttons (Like/Comment/Share/More)
    // Target: SVGs with aria-label, small elements on right edge
    document.querySelectorAll('svg[aria-label]').forEach(el => {
      if (isInstaPumpElement(el) || isVideoContainer(el)) return;
      const rect = el.getBoundingClientRect();
      const label = el.getAttribute('aria-label') || '';
      // Right edge icons (Like, Comment, Share, More)
      if (rect.left > vw - 60 &&
          ['Like', 'Comment', 'Share', 'More', 'Send'].includes(label)) {
        safeHide(el);
      }
    });

    // Pattern 3: Right-side button container
    // Target: narrow column containing Like+Comment+Share
    document.querySelectorAll('div').forEach(el => {
      if (isInstaPumpElement(el) || isVideoContainer(el)) return;
      const text = el.textContent || '';
      const rect = el.getBoundingClientRect();
      if (text.includes('Like') &&
          text.includes('Comment') &&
          text.includes('Share') &&
          rect.left > vw - 60 &&
          rect.width < 50) {
        safeHide(el);
      }
    });

    // Pattern 4: Username/Profile row with Follow button
    // Target: elements with "•Follow" in bottom 40% of screen
    document.querySelectorAll('div, span').forEach(el => {
      if (isInstaPumpElement(el) || isVideoContainer(el)) return;
      const text = el.textContent || '';
      const rect = el.getBoundingClientRect();
      if ((text.includes('•Follow') || text.includes('• Follow')) &&
          rect.top > vh * 0.6 &&
          rect.height < 150 &&
          !text.includes('HomeExplore')) {
        safeHide(el);
      }
    });

    // Pattern 5: Profile images (small circular images in bottom area)
    document.querySelectorAll('img').forEach(el => {
      if (isInstaPumpElement(el) || isVideoContainer(el)) return;
      const rect = el.getBoundingClientRect();
      // Small images (24-44px) in bottom 40%
      if (rect.width >= 24 && rect.width <= 44 &&
          rect.height >= 24 && rect.height <= 44 &&
          rect.top > vh * 0.6) {
        safeHide(el);
      }
    });

    // Pattern 6: Audio info area (bottom area with "Original audio")
    // Target: elements containing audio info text
    document.querySelectorAll('div, span').forEach(el => {
      if (isInstaPumpElement(el) || isVideoContainer(el)) return;
      const text = el.textContent || '';
      const rect = el.getBoundingClientRect();
      if (text.includes('Original audio') &&
          rect.top > vh * 0.7 &&
          rect.height < 50) {
        safeHide(el);
      }
    });

    // Pattern 7: Caption text (description text at bottom)
    // Target: text-heavy elements in bottom area, not containing nav/buttons
    document.querySelectorAll('span').forEach(el => {
      if (isInstaPumpElement(el) || isVideoContainer(el)) return;
      const rect = el.getBoundingClientRect();
      const text = el.textContent || '';
      // Caption spans: bottom area, has text, left-aligned
      if (rect.top > vh * 0.7 &&
          rect.left < 50 &&
          rect.height < 30 &&
          text.length > 20 &&
          !text.includes('Follow') &&
          !text.includes('HomeExplore')) {
        safeHide(el);
      }
    });

    // Pattern 8: Like/Comment counts (numbers on right side)
    document.querySelectorAll('span').forEach(el => {
      if (isInstaPumpElement(el) || isVideoContainer(el)) return;
      const rect = el.getBoundingClientRect();
      const text = el.textContent?.trim() || '';
      // Numeric counts on right edge
      if (rect.left > vw - 80 &&
          rect.width < 60 &&
          /^[\d,.KMB]+$/.test(text)) {
        safeHide(el);
      }
    });

    // Pattern 9: Audio album art (small images near audio link at bottom-right)
    document.querySelectorAll('div, img').forEach(el => {
      if (isInstaPumpElement(el) || isVideoContainer(el)) return;
      const rect = el.getBoundingClientRect();
      // Small elements (25-30px) at bottom-right corner
      if (rect.left > vw - 60 &&
          rect.top > vh * 0.7 &&
          rect.width >= 20 && rect.width <= 35 &&
          rect.height >= 20 && rect.height <= 35) {
        safeHide(el);
      }
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

  let pickerHighlightedEl = null;

  // Capture detailed element data for analysis
  function captureElementData(el) {
    const rect = el.getBoundingClientRect();

    // Get classes properly (handle SVG)
    let classes = [];
    if (el.className) {
      const cls = typeof el.className === 'string' ? el.className : (el.className.baseVal || '');
      classes = cls.trim().split(/\s+/).filter(c => c);
    }

    // Build parent chain
    const parentChain = [];
    let parent = el.parentElement;
    let depth = 0;
    while (parent && depth < 8) {
      const pInfo = { tag: parent.tagName };
      if (parent.getAttribute('aria-label')) pInfo.ariaLabel = parent.getAttribute('aria-label');
      if (parent.getAttribute('role')) pInfo.role = parent.getAttribute('role');
      parentChain.push(pInfo);
      parent = parent.parentElement;
      depth++;
    }

    // Get data attributes
    const dataAttrs = {};
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    }

    // Check for child elements
    const childTags = Array.from(el.children).map(c => c.tagName);

    // Find nearby stable anchors
    const nearestArticle = el.closest('article');
    const nearestSection = el.closest('section');
    const nearestAudioLink = el.closest('a[href*="/audio/"]') || el.querySelector('a[href*="/audio/"]');

    return {
      timestamp: new Date().toISOString(),
      tag: el.tagName,
      id: el.id || null,
      classes: classes,

      // Stable attributes
      ariaLabel: el.getAttribute('aria-label') || null,
      role: el.getAttribute('role') || null,
      href: el.getAttribute('href') || null,
      dataAttrs: Object.keys(dataAttrs).length > 0 ? dataAttrs : null,

      // Position
      rect: {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        w: Math.round(rect.width),
        h: Math.round(rect.height)
      },
      distFromRight: Math.round(window.innerWidth - rect.right),
      distFromBottom: Math.round(window.innerHeight - rect.bottom),
      viewport: { w: window.innerWidth, h: window.innerHeight },

      // Structure
      parentChain: parentChain,
      siblingIndex: el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0,
      siblingCount: el.parentElement ? el.parentElement.children.length : 0,
      childTags: childTags.length > 0 ? childTags : null,

      // Content
      textContent: el.textContent?.trim().slice(0, 50) || null,
      hasSvg: el.tagName === 'SVG' || el.querySelector('svg') !== null,
      hasImg: el.tagName === 'IMG' || el.querySelector('img') !== null,

      // Context
      insideArticle: nearestArticle !== null,
      insideSection: nearestSection !== null,
      nearAudioLink: nearestAudioLink !== null
    };
  }

  // Tap Inspector - shows ALL elements at a tap point and identifies click handlers
  function inspectTap(e) {
    if (!tapInspectorActive) return;
    if (e.target.id?.startsWith('instapump')) return;

    e.preventDefault();
    e.stopPropagation();

    // Fix: Use changedTouches for touchend events (touches is empty after finger lifts)
    const x = e.clientX ||
              (e.changedTouches && e.changedTouches[0]?.clientX) ||
              (e.touches && e.touches[0]?.clientX) || 0;
    const y = e.clientY ||
              (e.changedTouches && e.changedTouches[0]?.clientY) ||
              (e.touches && e.touches[0]?.clientY) || 0;

    // Get ALL elements at this point
    const elements = document.elementsFromPoint(x, y);

    log(`\n=== TAP INSPECTOR @ (${Math.round(x)}, ${Math.round(y)}) ===`);
    log(`Tapped element: <${e.target.tagName}>`);
    log(`Found ${elements.length} elements in stack:\n`);

    const results = [];
    let firstInteractive = null;

    elements.forEach((el, i) => {
      if (el.id?.startsWith('instapump')) return; // Skip our UI

      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      const isHiddenByUs = el.hasAttribute('data-instapump-hidden');

      // Detect potential click/tap handlers
      const hasOnClick = !!el.onclick;
      const hasOnTouchEnd = !!el.ontouchend;
      const hasOnTouchStart = !!el.ontouchstart;
      const hasRole = el.getAttribute('role');
      const isButton = hasRole === 'button' || el.tagName === 'BUTTON';
      const isLink = el.tagName === 'A' && el.href;
      const hasTabIndex = el.hasAttribute('tabindex');
      const hasCursor = styles.cursor === 'pointer';
      const canReceiveClicks = styles.pointerEvents !== 'none';

      // Check for React/framework event listeners (common patterns)
      const hasDataHandlers = Array.from(el.attributes).some(attr =>
        attr.name.startsWith('data-') && (attr.name.includes('click') || attr.name.includes('handler'))
      );

      const isInteractive = canReceiveClicks && (
        hasOnClick || hasOnTouchEnd || hasOnTouchStart ||
        isButton || isLink || hasTabIndex || hasCursor || hasDataHandlers
      );

      if (isInteractive && !firstInteractive) {
        firstInteractive = { index: i, element: el, tag: el.tagName };
      }

      const info = {
        index: i,
        tag: el.tagName,
        id: el.id || null,
        classes: el.className?.toString?.()?.slice(0, 60) || null,
        size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        pointerEvents: styles.pointerEvents,
        cursor: styles.cursor,
        zIndex: styles.zIndex,
        isHiddenByUs: isHiddenByUs,
        role: hasRole,
        ariaLabel: el.getAttribute('aria-label')?.slice(0, 50),
        // Interactive detection
        isInteractive: isInteractive,
        hasOnClick: hasOnClick,
        hasOnTouchEnd: hasOnTouchEnd,
        hasOnTouchStart: hasOnTouchStart,
        isButton: isButton,
        isLink: isLink
      };

      results.push(info);

      // Log each element with interaction info
      const hiddenFlag = isHiddenByUs ? ' [HIDDEN BY US]' : '';
      const invisibleFlag = styles.opacity === '0' || styles.visibility === 'hidden' ? ' [INVISIBLE]' : '';
      const interactiveFlag = isInteractive ? ' ⚡️INTERACTIVE' : '';
      const noClickFlag = !canReceiveClicks ? ' [NO POINTER]' : '';

      log(`${i}: <${el.tagName}>${hiddenFlag}${invisibleFlag}${interactiveFlag}${noClickFlag}`);
      log(`   size: ${info.size}, pointer-events: ${styles.pointerEvents}, cursor: ${styles.cursor}`);

      if (el.id) log(`   id: ${el.id}`);
      if (hasRole) log(`   role: ${hasRole}`);
      if (info.ariaLabel) log(`   aria-label: ${info.ariaLabel}`);

      // Show why it's interactive
      if (isInteractive) {
        const reasons = [];
        if (hasOnClick) reasons.push('onclick');
        if (hasOnTouchEnd) reasons.push('ontouchend');
        if (hasOnTouchStart) reasons.push('ontouchstart');
        if (isButton) reasons.push('button');
        if (isLink) reasons.push('link');
        if (hasTabIndex) reasons.push('tabindex');
        if (hasCursor) reasons.push('cursor:pointer');
        log(`   ⚡️ WHY: ${reasons.join(', ')}`);
      }
    });

    // Summary: which element likely handles the tap
    log(`\n=== TAP HANDLER ANALYSIS ===`);
    if (firstInteractive) {
      log(`🎯 First interactive element: #${firstInteractive.index} <${firstInteractive.tag}>`);
      const el = firstInteractive.element;
      log(`   This element likely handles taps for audio/video control`);
      if (el.getAttribute('aria-label')) {
        log(`   aria-label: "${el.getAttribute('aria-label')}"`);
      }
    } else {
      log(`⚠️ No obviously interactive elements found`);
      log(`   The tap might bubble up to a parent with delegated event handling`);
    }

    console.log('[InstaPump] Tap Inspector results:', results);
    console.log('[InstaPump] First interactive:', firstInteractive);
    showToast(`Found ${elements.length} elements - first interactive: ${firstInteractive ? firstInteractive.tag : 'none'}`);

    // Auto-show logs panel
    if (!logsVisible) {
      showLogsPanel();
    }
  }

  function pickerClick(e) {
    if (!pickerActive || !pickerLastEl) return;
    if (e.target.id?.startsWith('instapump')) return;
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - pickerLastTap < 300 && pickerHighlightedEl === pickerLastEl) {
      // Double-tap on same element - capture data and hide
      const el = pickerLastEl;

      // Don't hide videos or elements containing videos
      if (el.tagName === 'VIDEO' || el.querySelector('video')) {
        showToast('Cannot hide video elements');
        return;
      }

      // Don't hide the clips overlay (audio toggle layer)
      if (el.id?.startsWith('clipsoverlay')) {
        showToast('Cannot hide: audio control layer');
        return;
      }

      // Capture detailed element data
      const data = captureElementData(el);

      // Store in session arrays
      sessionHiddenElements.push({ element: el, data: data });
      sessionElementData.push(data);

      // Hide the element (session only)
      el.style.setProperty('display', 'none', 'important');

      // Log the data
      const logEntry = JSON.stringify(data, null, 2);
      log('PICKED #' + sessionElementData.length + ':\n' + logEntry);
      console.log('[InstaPump] Element picked:', data);

      showToast('Hidden #' + sessionElementData.length + ' (' + data.tag + ')');

      pickerLastTap = 0;
      pickerHighlightedEl = null;
    } else {
      // Single tap - highlight element
      if (pickerHighlightedEl && pickerHighlightedEl !== pickerLastEl) {
        pickerHighlightedEl.style.outline = '';
        pickerHighlightedEl.style.background = '';
      }
      pickerLastEl.style.outline = '3px solid #ff9500';
      pickerLastEl.style.background = 'rgba(255, 149, 0, 0.2)';
      pickerHighlightedEl = pickerLastEl;
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

  // List count display
  function updateListCount() {
    const countEl = document.getElementById('instapump-list-count');
    if (!countEl) return;
    const wCount = getAllowlist().length;
    const bCount = getBlocklist().length;
    countEl.textContent = `W:${wCount} B:${bCount}`;
  }

  // List panel
  let currentListTab = 'whitelist';

  function showListPanel() {
    const panel = document.getElementById('instapump-list-panel');
    if (panel) {
      panel.classList.add('visible');
      renderListPanel();
    }
  }

  function hideListPanel() {
    const panel = document.getElementById('instapump-list-panel');
    if (panel) panel.classList.remove('visible');
  }

  function renderListPanel() {
    const content = document.getElementById('instapump-list-content');
    const wlCount = document.getElementById('instapump-wl-count');
    const blCount = document.getElementById('instapump-bl-count');
    if (!content) return;

    const allowlist = getAllowlist();
    const blocklist = getBlocklist();

    // Update tab counts
    if (wlCount) wlCount.textContent = allowlist.length;
    if (blCount) blCount.textContent = blocklist.length;

    // Update tab active states
    document.querySelectorAll('#instapump-list-panel .panel-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === currentListTab);
    });

    // Render list
    const list = currentListTab === 'whitelist' ? allowlist : blocklist;
    const listType = currentListTab;

    if (list.length === 0) {
      content.innerHTML = `<div class="empty-message">No ${listType === 'whitelist' ? 'whitelisted' : 'blocked'} accounts yet.<br><br>${listType === 'whitelist' ? 'Swipe right to approve accounts.' : 'Swipe left to block accounts.'}</div>`;
      return;
    }

    content.innerHTML = list.map(username => `
      <div class="list-item" data-username="${username}" data-list="${listType}">
        <span class="username">@${username}</span>
        <button class="remove-btn" title="Remove">×</button>
      </div>
    `).join('');

    // Add click handlers for remove buttons
    content.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.list-item');
        const username = item.dataset.username;
        const listType = item.dataset.list;
        removeFromList(username, listType);
      });
    });
  }

  function removeFromList(username, listType) {
    if (listType === 'whitelist') {
      const list = getAllowlist().filter(u => u !== username);
      saveAllowlist(list);
      showToast(`Removed @${username} from whitelist`);
    } else {
      const list = getBlocklist().filter(u => u !== username);
      saveBlocklist(list);
      showToast(`Removed @${username} from blocklist`);
    }
    renderListPanel();
    updateListCount();
    updateStatusBorder();
  }

  // Create UI
  function createUI() {
    console.log('🔧 createUI called, body exists:', !!document.body);
    if (document.getElementById('instapump-fab')) {
      console.log('⚠️ FAB already exists');
      return;
    }

    // Version badge
    const version = document.createElement('div');
    version.id = 'instapump-version';
    version.textContent = 'v2.1.20';
    document.body.appendChild(version);

    // List count badge
    const listCount = document.createElement('div');
    listCount.id = 'instapump-list-count';
    document.body.appendChild(listCount);
    updateListCount();

    // Status border
    const status = document.createElement('div');
    status.id = 'instapump-status';
    document.body.appendChild(status);
    console.log('✅ Status border created');

    // FAB container
    const fab = document.createElement('div');
    fab.id = 'instapump-fab';
    fab.innerHTML = `
      <button id="instapump-fab-main" class="${currentMode}">${currentMode === 'discovery' ? 'D' : 'W'}</button>
      <div id="instapump-fab-menu">
        <button class="instapump-fab-btn" id="instapump-btn-lists" title="View Lists" style="background: linear-gradient(135deg, #007aff, #5856d6);">📝</button>
        <button class="instapump-fab-btn" id="instapump-btn-picker" title="Element Picker">✂</button>
        <button class="instapump-fab-btn" id="instapump-btn-logs" title="Logs">📋</button>
        <button class="instapump-fab-btn" id="instapump-btn-hide" title="Toggle Hiding" style="background: linear-gradient(135deg, ${hidingEnabled ? '#34c759, #30d158' : '#ff3b30, #ff453a'});">${hidingEnabled ? '👁' : '👁‍🗨'}</button>
        <button class="instapump-fab-btn" id="instapump-btn-inspect" title="Tap Inspector" style="background: linear-gradient(135deg, #5856d6, #6e6ce3);">🔍</button>
      </div>
    `;
    document.body.appendChild(fab);
    console.log('✅ FAB created:', fab, 'Parent:', fab.parentElement);

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
        <span>Debug Logs (<span id="instapump-pick-count">0</span> picked)</span>
        <div>
          <button id="instapump-btn-export">Export JSON</button>
          <button id="instapump-btn-copy">Copy Logs</button>
          <button id="instapump-btn-clear">Clear</button>
          <button id="instapump-btn-close">✕</button>
        </div>
      </div>
      <div id="instapump-logs-content"></div>
    `;
    document.body.appendChild(logsPanel);

    // List viewer panel
    const listPanel = document.createElement('div');
    listPanel.id = 'instapump-list-panel';
    listPanel.innerHTML = `
      <div class="panel-header">
        <h3>Account Lists</h3>
        <button class="panel-close" id="instapump-list-close">×</button>
      </div>
      <div class="panel-tabs">
        <button class="panel-tab active" data-tab="whitelist">Whitelist (<span id="instapump-wl-count">0</span>)</button>
        <button class="panel-tab blocked" data-tab="blocklist">Blocked (<span id="instapump-bl-count">0</span>)</button>
      </div>
      <div class="panel-content" id="instapump-list-content"></div>
    `;
    document.body.appendChild(listPanel);

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

    document.getElementById('instapump-btn-lists').addEventListener('click', () => {
      closeFabMenu();
      showListPanel();
    });

    document.getElementById('instapump-btn-picker').addEventListener('click', () => {
      closeFabMenu();
      togglePicker();
    });

    document.getElementById('instapump-btn-logs').addEventListener('click', () => {
      closeFabMenu();
      showLogsPanel();
    });

    // List panel interactions
    document.getElementById('instapump-list-close').addEventListener('click', hideListPanel);

    document.querySelectorAll('#instapump-list-panel .panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentListTab = tab.dataset.tab;
        renderListPanel();
      });
    });

    document.getElementById('instapump-btn-hide').addEventListener('click', () => {
      closeFabMenu();
      hidingEnabled = !hidingEnabled;
      localStorage.setItem('instapump_hiding', hidingEnabled ? 'true' : 'false');
      const btn = document.getElementById('instapump-btn-hide');
      if (hidingEnabled) {
        btn.style.background = 'linear-gradient(135deg, #34c759, #30d158)';
        btn.textContent = '👁';
        showToast('Hiding ON');
        hideElements(); // Re-apply hiding
      } else {
        btn.style.background = 'linear-gradient(135deg, #ff3b30, #ff453a)';
        btn.textContent = '👁‍🗨';
        showToast('Hiding OFF - All elements visible');
        // Restore all hidden elements without refresh
        document.querySelectorAll('[data-instapump-hidden]').forEach(el => {
          el.style.display = '';
          el.removeAttribute('data-instapump-hidden');
        });
      }
    });

    document.getElementById('instapump-btn-inspect').addEventListener('click', () => {
      closeFabMenu();
      tapInspectorActive = !tapInspectorActive;
      const btn = document.getElementById('instapump-btn-inspect');
      if (tapInspectorActive) {
        btn.style.background = 'linear-gradient(135deg, #ff9500, #ffaa33)';
        showToast('Tap Inspector ON - tap anywhere to inspect');
        // Add tap listener
        document.addEventListener('click', inspectTap, true);
        document.addEventListener('touchend', inspectTap, true);
      } else {
        btn.style.background = 'linear-gradient(135deg, #5856d6, #6e6ce3)';
        showToast('Tap Inspector OFF');
        // Remove tap listener
        document.removeEventListener('click', inspectTap, true);
        document.removeEventListener('touchend', inspectTap, true);
      }
    });

    document.getElementById('instapump-btn-export').addEventListener('click', () => {
      if (sessionElementData.length === 0) {
        showToast('No elements picked yet');
        return;
      }
      const exportData = {
        exportedAt: new Date().toISOString(),
        elementCount: sessionElementData.length,
        elements: sessionElementData
      };
      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      showToast('Exported ' + sessionElementData.length + ' elements');
    });

    document.getElementById('instapump-btn-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(logs.join('\n'));
      showToast('Logs copied');
    });

    document.getElementById('instapump-btn-clear').addEventListener('click', () => {
      logs.length = 0;
      sessionElementData.length = 0;
      sessionHiddenElements.length = 0;
      updateLogsDisplay();
      showToast('Cleared all');
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
      if (e.target.closest('#instapump-fab, #instapump-logs, #instapump-list-panel')) return;
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
        // Prevent Instagram from seeing this as a tap (which pauses video)
        e.preventDefault();
        e.stopPropagation();

        // Resume video if Instagram paused it on touchstart
        const video = document.querySelector('video');
        if (video && video.paused) {
          video.play().catch(() => {}); // Ignore autoplay errors
        }

        if (deltaX > 0) {
          showSwipeIndicator('approve');
          approveAccount();
        } else {
          showSwipeIndicator('reject');
          rejectAccount();
        }
      }
    }, { passive: false }); // passive: false to allow preventDefault
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
    const observer = new MutationObserver(() => {
      hideElements();
      setupVideoAutoAdvance(); // Track new videos for auto-advance
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(pollAndFilter, 500);
    setupVideoAutoAdvance(); // Initial setup
    log('InstaPump v2.1.20 loaded - Resume video after swipe');
    console.log('✅ Init complete, FAB should be visible at bottom-right');
    console.log('📋 Saved selectors:', getSavedSelectors());
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
