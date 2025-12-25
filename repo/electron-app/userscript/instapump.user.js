// ==UserScript==
// @name         InstaPump - Clean Reels Experience
// @namespace    https://instapump.app
// @version      1.0.0
// @description  Full-screen Instagram Reels with hidden UI elements
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
    // Redirect to reels if on main Instagram page
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.location.href = 'https://www.instagram.com/reels/';
      return;
    }
  }

  // CSS to hide Instagram UI elements
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

    /* Scroll snap for reels - makes each video snap to full screen */
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

    /* Main container should also have scroll snap */
    main, [role="main"], [role="feed"] {
      scroll-snap-type: y mandatory !important;
      height: 100vh !important;
      overflow-y: scroll !important;
      overflow-x: hidden !important;
    }

    /* Hide right side panel div */
    div.x1nhvcw1.x1oa3qoh.x6s0dn4.xqjyukv.x1q0g3np.x2lah0s.x1c4vz4f {
      display: none !important;
      visibility: hidden !important;
    }

    /* Hide interaction buttons panel */
    div.x1g9anri.x78zum5.xvs91rp.xmix8c7.xd4r4e8.x6ikm8r.x10wlt62.x1i0vuye {
      display: none !important;
      visibility: hidden !important;
    }

    /* Hide bottom overlay div */
    div.x1diwwjn.x1247r65.x13a6bvl {
      display: none !important;
      visibility: hidden !important;
    }

    /* Hide side panel div */
    div.xuk3077.x1nhvcw1.xdt5ytf {
      display: none !important;
      visibility: hidden !important;
    }

    /* Hide all UI overlays - keep only video container */
    article div[style*="right"] {
      display: none !important;
    }

    /* Hide bottom overlays (username, caption, music) */
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

    /* Hide spans and links that show counts, usernames, captions */
    article span[dir="auto"],
    article a[role="link"]:not([href*="/reels/"]) {
      visibility: hidden !important;
    }

    /* Hide all SVG icons */
    article svg {
      display: none !important;
    }

    /* Hide canvas elements */
    article canvas {
      display: none !important;
    }

    /* Hide profile images and thumbnails */
    article img {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      width: 0 !important;
      height: 0 !important;
    }

    /* Hide specific profile image */
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

    /* InstaPump Control Panel */
    #instapump-controls {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .instapump-btn {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 24px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      -webkit-tap-highlight-color: transparent;
    }

    .instapump-btn:active {
      transform: scale(0.95);
    }

    #instapump-approve {
      background: linear-gradient(135deg, #34c759, #30d158);
    }

    #instapump-reject {
      background: linear-gradient(135deg, #ff3b30, #ff453a);
    }

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

    #instapump-toast.visible {
      opacity: 1;
    }

    #instapump-status {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 999998;
      border: 4px solid transparent;
      transition: border-color 0.3s;
    }

    #instapump-status.approved {
      border-color: #34c759;
    }

    #instapump-status.rejected {
      border-color: #ff3b30;
    }
  `;

  // Inject CSS immediately
  function injectCSS() {
    if (document.getElementById('instapump-css')) return;
    const style = document.createElement('style');
    style.id = 'instapump-css';
    style.textContent = HIDE_CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  // Inject CSS as early as possible
  injectCSS();

  // Storage keys
  const STORAGE_KEY_ALLOWLIST = 'instapump_allowlist';
  const STORAGE_KEY_BLOCKLIST = 'instapump_blocklist';

  // Get lists from localStorage
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

  // Current username detection
  let currentUsername = null;

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

  // Toast notification
  function showToast(message) {
    let toast = document.getElementById('instapump-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'instapump-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }

  // Update status border
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

  // Approve current account
  function approveAccount() {
    if (!currentUsername) {
      showToast('No account detected');
      return;
    }

    const allowlist = getAllowlist();
    const blocklist = getBlocklist();

    // Add to allowlist
    if (!allowlist.includes(currentUsername)) {
      allowlist.push(currentUsername);
      saveAllowlist(allowlist);
    }

    // Remove from blocklist
    const blockIdx = blocklist.indexOf(currentUsername);
    if (blockIdx > -1) {
      blocklist.splice(blockIdx, 1);
      saveBlocklist(blocklist);
    }

    showToast('Approved @' + currentUsername);
    updateStatusBorder();
  }

  // Reject current account
  function rejectAccount() {
    if (!currentUsername) {
      showToast('No account detected');
      return;
    }

    const allowlist = getAllowlist();
    const blocklist = getBlocklist();

    // Add to blocklist
    if (!blocklist.includes(currentUsername)) {
      blocklist.push(currentUsername);
      saveBlocklist(blocklist);
    }

    // Remove from allowlist
    const allowIdx = allowlist.indexOf(currentUsername);
    if (allowIdx > -1) {
      allowlist.splice(allowIdx, 1);
      saveAllowlist(allowlist);
    }

    showToast('Rejected @' + currentUsername);
    updateStatusBorder();
  }

  // Navigate to next/prev reel
  function navigateReel(direction) {
    const articles = Array.from(document.querySelectorAll('article'));
    if (articles.length === 0) return;

    // Find current article
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

    // Navigate
    let targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    targetIdx = Math.max(0, Math.min(targetIdx, articles.length - 1));

    if (articles[targetIdx]) {
      articles[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Hide elements via JS (for dynamic content)
  function hideElements() {
    // Hide bottom nav bar
    document.querySelectorAll('div[role="tablist"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
      if (el.parentElement) {
        el.parentElement.style.setProperty('display', 'none', 'important');
      }
    });

    // Hide fixed elements at bottom
    document.querySelectorAll('div, nav, footer').forEach(el => {
      try {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if ((style.position === 'fixed' || style.position === 'sticky') &&
            rect.bottom >= window.innerHeight - 10 &&
            rect.top > window.innerHeight - 100) {
          el.style.setProperty('display', 'none', 'important');
        }
      } catch(e) {}
    });

    // Hide right side elements
    document.querySelectorAll('svg, div, span, button, a').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.left > window.innerWidth - 100 && rect.width < 100 && rect.height < 100) {
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      }
    });

    // Expand videos
    document.querySelectorAll('video').forEach(video => {
      video.style.setProperty('width', '100vw', 'important');
      video.style.setProperty('height', '100vh', 'important');
      video.style.setProperty('object-fit', 'cover', 'important');
    });

    // Canvas elements
    document.querySelectorAll('canvas').forEach(canvas => {
      canvas.style.setProperty('display', 'none', 'important');
    });
  }

  // Create control buttons
  function createControls() {
    if (document.getElementById('instapump-controls')) return;

    const controls = document.createElement('div');
    controls.id = 'instapump-controls';

    const approveBtn = document.createElement('button');
    approveBtn.id = 'instapump-approve';
    approveBtn.className = 'instapump-btn';
    approveBtn.textContent = '+';
    approveBtn.addEventListener('click', approveAccount);

    const rejectBtn = document.createElement('button');
    rejectBtn.id = 'instapump-reject';
    rejectBtn.className = 'instapump-btn';
    rejectBtn.textContent = '−';
    rejectBtn.addEventListener('click', rejectAccount);

    controls.appendChild(approveBtn);
    controls.appendChild(rejectBtn);
    document.body.appendChild(controls);

    // Create status border
    const status = document.createElement('div');
    status.id = 'instapump-status';
    document.body.appendChild(status);

    // Create toast
    const toast = document.createElement('div');
    toast.id = 'instapump-toast';
    document.body.appendChild(toast);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') approveAccount();
    if (e.key === 'ArrowLeft') rejectAccount();
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      navigateReel('next');
    }
    if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      navigateReel('prev');
    }
  });

  // Poll for username and check blocklist
  function pollAndFilter() {
    const username = detectUsername();
    if (username && username !== currentUsername) {
      currentUsername = username;
      updateStatusBorder();

      // Auto-skip if blocked
      const blocklist = getBlocklist();
      if (blocklist.includes(username)) {
        showToast('Skipping @' + username);
        setTimeout(() => navigateReel('next'), 300);
      }
    }
  }

  // Initialize when DOM is ready
  function init() {
    injectCSS();
    hideElements();
    createControls();

    // Set up observers and intervals
    const observer = new MutationObserver(hideElements);
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(pollAndFilter, 500);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also run on page load
  window.addEventListener('load', () => {
    init();
    hideElements();
  });

  // Expose functions for debugging
  window.instapump = {
    approve: approveAccount,
    reject: rejectAccount,
    next: () => navigateReel('next'),
    prev: () => navigateReel('prev'),
    getAllowlist,
    getBlocklist,
    clearLists: () => {
      localStorage.removeItem(STORAGE_KEY_ALLOWLIST);
      localStorage.removeItem(STORAGE_KEY_BLOCKLIST);
      showToast('Lists cleared');
    }
  };

  console.log('[InstaPump] Loaded. Use window.instapump for controls.');
})();
