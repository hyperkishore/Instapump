// InstaPump - Clean Reels Experience
// Chrome Extension Content Script

(function() {
  'use strict';

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
  const STORAGE_KEY_MODE = 'instapump_mode'; // 'discovery' or 'whitelist'

  // State
  let currentUsername = null;
  let initialized = false;
  let filterMode = 'whitelist'; // Default to whitelist-only mode
  let skipCount = 0; // Track skipped reels
  let inspectorEnabled = false; // Element inspector state
  let globalMuted = true; // Global mute state - starts muted

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
    // Also sync to chrome.storage for popup access
    if (chrome.storage) {
      chrome.storage.local.set({ allowlist: list });
    }
  }

  function saveBlocklist(list) {
    localStorage.setItem(STORAGE_KEY_BLOCKLIST, JSON.stringify(list));
    // Also sync to chrome.storage for popup access
    if (chrome.storage) {
      chrome.storage.local.set({ blocklist: list });
    }
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
    if (chrome.storage) {
      chrome.storage.local.set({ filterMode: mode });
    }
    updateModeIndicator();
    showToast(mode === 'whitelist' ? 'Whitelist-only mode' : 'Discovery mode');
  }

  function toggleFilterMode() {
    const newMode = filterMode === 'whitelist' ? 'discovery' : 'whitelist';
    setFilterMode(newMode);
  }

  // ==================== Username Detection ====================

  function detectUsername() {
    // System pages to exclude
    const systemPages = ['reels', 'explore', 'p', 'reel', 'direct', 'stories', 'accounts', 'about', 'settings', 'nametag', 'directory', 'legal', 'privacy', 'terms', 'session', 'emails', 'oauth', 'tags', 'locations', 'audio', 'api', 'developer', 'help', 'press', 'jobs', 'blog'];

    // Find the currently visible reel (presentation element closest to viewport center)
    const presentations = Array.from(document.querySelectorAll('[role="presentation"]'));
    const viewportCenterY = window.innerHeight / 2;

    let visibleReel = null;
    let minDistance = Infinity;

    for (const pres of presentations) {
      const rect = pres.getBoundingClientRect();
      // Skip if not visible at all
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(centerY - viewportCenterY);

      if (distance < minDistance) {
        minDistance = distance;
        visibleReel = pres;
      }
    }

    if (!visibleReel) return null;

    // Look for username link within the visible reel
    const links = visibleReel.querySelectorAll('a[href^="/"]');

    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href) continue;

      // Match /USERNAME/reels/ pattern (most reliable)
      const reelsMatch = href.match(/^\/([a-zA-Z0-9._]+)\/reels\/?/);
      if (reelsMatch) {
        const username = reelsMatch[1].toLowerCase();
        if (!systemPages.includes(username)) {
          return username;
        }
      }
    }

    // Fallback: Match /USERNAME/ pattern
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

    // Add to allowlist if not already there
    if (!allowlist.includes(currentUsername)) {
      allowlist.push(currentUsername);
      saveAllowlist(allowlist);
    }

    // Remove from blocklist if present
    const blockIdx = blocklist.indexOf(currentUsername);
    if (blockIdx > -1) {
      blocklist.splice(blockIdx, 1);
      saveBlocklist(blocklist);
    }

    showToast('✓ Approved @' + currentUsername, 'approved');
    updateStatusBorder();
  }

  function rejectAccount() {
    if (!currentUsername) {
      showToast('No account detected');
      return;
    }

    const allowlist = getAllowlist();
    const blocklist = getBlocklist();

    // Add to blocklist if not already there
    if (!blocklist.includes(currentUsername)) {
      blocklist.push(currentUsername);
      saveBlocklist(blocklist);
    }

    // Remove from allowlist if present
    const allowIdx = allowlist.indexOf(currentUsername);
    if (allowIdx > -1) {
      allowlist.splice(allowIdx, 1);
      saveAllowlist(allowlist);
    }

    showToast('✗ Rejected @' + currentUsername, 'rejected');
    updateStatusBorder();
  }

  // ==================== Navigation ====================

  function navigateReel(direction) {
    const reels = Array.from(document.querySelectorAll('[role="presentation"]'));
    if (reels.length === 0) {
      // Fallback: scroll by viewport height
      window.scrollBy({
        top: direction === 'next' ? window.innerHeight : -window.innerHeight,
        behavior: 'smooth'
      });
      return;
    }

    // Find currently visible reel
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

    // Calculate target
    let targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    targetIdx = Math.max(0, Math.min(targetIdx, reels.length - 1));

    // Scroll to target
    if (reels[targetIdx]) {
      reels[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ==================== Element Hiding ====================

  function hideElements() {
    // Hide bottom nav bar
    document.querySelectorAll('div[role="tablist"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
      if (el.parentElement) {
        el.parentElement.style.setProperty('display', 'none', 'important');
      }
    });

    // Hide fixed bottom elements
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
      try {
        const rect = el.getBoundingClientRect();
        if (rect.left > window.innerWidth - 100 && rect.width < 100 && rect.height < 100) {
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      } catch(e) {}
    });

    // Expand videos
    document.querySelectorAll('video').forEach(video => {
      video.style.setProperty('width', '100vw', 'important');
      video.style.setProperty('height', '100vh', 'important');
      video.style.setProperty('object-fit', 'cover', 'important');
    });

    // Hide canvas
    document.querySelectorAll('canvas').forEach(canvas => {
      canvas.style.setProperty('display', 'none', 'important');
    });
  }

  // ==================== Control Panel ====================

  function createControls() {
    if (document.getElementById('instapump-controls')) return;

    // Control panel container
    const controls = document.createElement('div');
    controls.id = 'instapump-controls';

    // Mode toggle button
    const modeBtn = document.createElement('button');
    modeBtn.id = 'instapump-mode-btn';
    modeBtn.className = 'instapump-btn instapump-btn-small';
    modeBtn.textContent = 'M';
    modeBtn.title = 'Toggle filter mode (M key)';
    modeBtn.addEventListener('click', toggleFilterMode);

    // Inspect button
    const inspectBtn = document.createElement('button');
    inspectBtn.id = 'instapump-inspect-btn';
    inspectBtn.className = 'instapump-btn instapump-btn-small';
    inspectBtn.textContent = '🔍';
    inspectBtn.title = 'Toggle element inspector (I key)';
    inspectBtn.style.background = 'linear-gradient(135deg, #4285f4, #34a853)';
    inspectBtn.addEventListener('click', enableHoverInspector);

    // Approve button
    const approveBtn = document.createElement('button');
    approveBtn.id = 'instapump-approve';
    approveBtn.className = 'instapump-btn';
    approveBtn.textContent = '+';
    approveBtn.title = 'Approve account (Right Arrow)';
    approveBtn.addEventListener('click', approveAccount);

    // Reject button
    const rejectBtn = document.createElement('button');
    rejectBtn.id = 'instapump-reject';
    rejectBtn.className = 'instapump-btn';
    rejectBtn.textContent = '-';
    rejectBtn.title = 'Reject account (Left Arrow)';
    rejectBtn.addEventListener('click', rejectAccount);

    controls.appendChild(inspectBtn);
    controls.appendChild(modeBtn);
    controls.appendChild(approveBtn);
    controls.appendChild(rejectBtn);
    document.body.appendChild(controls);

    // Status border
    const status = document.createElement('div');
    status.id = 'instapump-status';
    document.body.appendChild(status);

    // Toast
    const toast = document.createElement('div');
    toast.id = 'instapump-toast';
    document.body.appendChild(toast);

    // Username display
    const username = document.createElement('div');
    username.id = 'instapump-username';
    document.body.appendChild(username);
  }

  // ==================== Keyboard Shortcuts ====================

  function setupKeyboardShortcuts() {
    // Use capture phase to intercept before Instagram handles the event
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input
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
        case 'i':
        case 'I':
          e.preventDefault();
          e.stopPropagation();
          enableHoverInspector();
          break;
        case 'Escape':
          if (inspectorEnabled) {
            e.preventDefault();
            e.stopPropagation();
            disableHoverInspector();
          }
          break;
        case ' ': // Spacebar to toggle mute
          e.preventDefault();
          e.stopPropagation();
          toggleMute();
          break;
      }
    }, true); // true = capture phase
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
    // Toggle global mute state
    globalMuted = !globalMuted;
    showToast(globalMuted ? '🔇 Muted' : '🔊 Unmuted');
    syncVideoAudio();
  }

  function syncVideoAudio() {
    // Apply global mute state to the visible video
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

    // Sync audio state to visible video
    syncVideoAudio();

    if (username && username !== currentUsername) {
      currentUsername = username;
      updateStatusBorder();
      updateUsernameDisplay();

      const allowlist = getAllowlist();
      const blocklist = getBlocklist();

      // Whitelist-only mode: skip accounts NOT in the allowlist
      if (filterMode === 'whitelist') {
        if (!allowlist.includes(username)) {
          skipCount++;
          updateSkipCounter();
          // Don't show toast for every skip in whitelist mode (too noisy)
          // Just skip silently
          setTimeout(() => navigateReel('next'), 150);
          return;
        }
      } else {
        // Discovery mode: skip only blocked accounts
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

    console.log('[InstaPump] Initializing...');

    // Load filter mode from storage
    filterMode = getFilterMode();

    // Hide elements
    hideElements();

    // Create UI
    createControls();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Update mode indicator
    updateModeIndicator();
    updateSkipCounter();

    // Setup mutation observer for dynamic content
    const observer = new MutationObserver(() => {
      hideElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Start polling for username
    setInterval(pollAndFilter, 500);

    // Sync storage
    if (chrome.storage) {
      chrome.storage.local.set({
        allowlist: getAllowlist(),
        blocklist: getBlocklist(),
        filterMode: filterMode
      });
    }

    const allowlist = getAllowlist();
    console.log(`[InstaPump] Loaded in ${filterMode} mode. ${allowlist.length} accounts in whitelist.`);
    console.log('[InstaPump] Keys: ←/→ approve/reject, ↑/↓ navigate, M toggle mode');
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also run on load
  window.addEventListener('load', init);

  // ==================== Hover Inspector ====================

  function enableHoverInspector() {
    if (inspectorEnabled) {
      disableHoverInspector();
      return;
    }
    inspectorEnabled = true;

    // Create overlay
    let overlay = document.getElementById('instapump-inspect-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'instapump-inspect-overlay';
      overlay.style.cssText = 'position:fixed;pointer-events:none;background:rgba(66,133,244,0.3);border:2px solid #4285f4;z-index:9999999;display:none;transition:all 0.05s;';
      document.body.appendChild(overlay);
    }

    // Create info box
    let infoBox = document.getElementById('instapump-inspect-info');
    if (!infoBox) {
      infoBox = document.createElement('div');
      infoBox.id = 'instapump-inspect-info';
      infoBox.style.cssText = 'position:fixed;bottom:20px;left:20px;background:rgba(0,0,0,0.9);color:#fff;padding:12px 16px;border-radius:8px;font-family:monospace;font-size:11px;z-index:9999999;max-width:400px;word-break:break-all;';
      document.body.appendChild(infoBox);
    }

    window.__instapump_saved = window.__instapump_saved || [];
    window.__instapump_lastEl = null;

    window.__instapump_mousemove = function(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el === overlay || el === infoBox || el.id?.startsWith('instapump')) return;

      const r = el.getBoundingClientRect();
      overlay.style.display = 'block';
      overlay.style.left = r.left + 'px';
      overlay.style.top = r.top + 'px';
      overlay.style.width = r.width + 'px';
      overlay.style.height = r.height + 'px';
      window.__instapump_lastEl = el;

      // Show info
      const cls = (el.className || '').toString().substring(0, 100);
      const role = el.getAttribute('role') || '';
      infoBox.innerHTML = `<b>${el.tagName}</b> ${r.width.toFixed(0)}x${r.height.toFixed(0)}<br>class: ${cls}<br>role: ${role}<br><span style="color:#aaa">Click to save, ESC to exit</span>`;
    };

    window.__instapump_click = function(e) {
      const el = window.__instapump_lastEl;
      if (!el) return;

      e.preventDefault();
      e.stopPropagation();

      const cls = (el.className || '').toString();
      window.__instapump_saved.push({ tag: el.tagName, class: cls, el: el });
      el.style.outline = '3px solid #fbbc04';
      el.style.background = 'rgba(251,188,4,0.2)';

      console.log('[InstaPump] SAVED #' + window.__instapump_saved.length + ':', {
        tag: el.tagName,
        class: cls,
        rect: el.getBoundingClientRect()
      });

      showToast('Saved element #' + window.__instapump_saved.length);
    };

    document.addEventListener('mousemove', window.__instapump_mousemove);
    document.addEventListener('click', window.__instapump_click, true);

    showToast('Inspector ON - Click elements to save, ESC to exit');
    console.log('[InstaPump] Inspector enabled. Use getSaved() or analyze() in console.');
  }

  function disableHoverInspector() {
    inspectorEnabled = false;

    const overlay = document.getElementById('instapump-inspect-overlay');
    const infoBox = document.getElementById('instapump-inspect-info');
    if (overlay) overlay.style.display = 'none';
    if (infoBox) infoBox.remove();

    document.removeEventListener('mousemove', window.__instapump_mousemove);
    document.removeEventListener('click', window.__instapump_click, true);

    showToast('Inspector OFF');
  }

  // Console helpers for inspector
  window.getSaved = function() {
    return window.__instapump_saved || [];
  };

  window.analyze = function() {
    const saved = window.__instapump_saved || [];
    saved.forEach((s, i) => {
      const el = s.el;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      console.log('--- SAVED #' + (i + 1) + ' (' + s.tag + ') ---');
      console.log('Class:', s.class);
      console.log('Size:', Math.round(r.width) + 'x' + Math.round(r.height));
      console.log('Position:', Math.round(r.left) + ',' + Math.round(r.top));
      console.log('Display:', cs.display, '| Overflow:', cs.overflow);
      console.log('Selector suggestion:', s.tag.toLowerCase() + '.' + s.class.split(' ').slice(0, 3).join('.'));
    });
  };

  window.clearSaved = function() {
    (window.__instapump_saved || []).forEach(s => {
      s.el.style.outline = '';
      s.el.style.background = '';
    });
    window.__instapump_saved = [];
    console.log('[InstaPump] Cleared saved elements');
  };

  // Expose API for debugging and bulk import
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

    // Bulk import accounts to allowlist
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

    // Export allowlist
    exportAccounts: () => {
      const allowlist = getAllowlist();
      return allowlist.join('\n');
    },

    clearLists: () => {
      localStorage.removeItem(STORAGE_KEY_ALLOWLIST);
      localStorage.removeItem(STORAGE_KEY_BLOCKLIST);
      skipCount = 0;
      if (chrome.storage) {
        chrome.storage.local.remove(['allowlist', 'blocklist']);
      }
      updateModeIndicator();
      updateSkipCounter();
      showToast('Lists cleared');
    },

    getUsername: () => currentUsername,
    getSkipCount: () => skipCount,
    resetSkipCount: () => { skipCount = 0; updateSkipCounter(); },

    // Inspector
    inspect: enableHoverInspector,
    stopInspect: disableHoverInspector
  };

})();
