// InstaPump - Simplified Version
(function() {
  'use strict';

  const webview = document.getElementById('instagram-webview');
  const loading = document.getElementById('loading');
  const fabMain = document.getElementById('fab-main');
  const fabMenu = document.getElementById('fab-menu');
  const btnPicker = document.getElementById('btn-picker');
  const btnLogs = document.getElementById('btn-logs');
  const currentUserDisplay = document.getElementById('current-user');
  const statusBorder = document.getElementById('status-border');
  const toast = document.getElementById('toast');
  const swipeIndicator = document.getElementById('swipe-indicator');
  const logsPanel = document.getElementById('logs-panel');
  const logsContent = document.getElementById('logs-content');

  let webviewReady = false;
  let currentUsername = null;
  let filterState = { allowlist: [], blocklist: [] };

  // Mode: 'discovery' or 'whitelist'
  let currentMode = 'discovery';
  let fabMenuOpen = false;

  // Logging
  const logs = [];

  // Simple toast
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
    log(msg);
  }

  // Logging
  function log(msg) {
    const timestamp = new Date().toLocaleTimeString();
    logs.push(`[${timestamp}] ${msg}`);
    if (logs.length > 200) logs.shift();
    updateLogsDisplay();
  }

  function updateLogsDisplay() {
    if (!logsPanel.classList.contains('visible')) return;
    logsContent.innerHTML = logs.map(l => `<div class="log-entry">${l}</div>`).join('');
    logsContent.scrollTop = logsContent.scrollHeight;
  }

  function showLogsPanel() {
    logsPanel.classList.add('visible');
    updateLogsDisplay();
  }

  function hideLogsPanel() {
    logsPanel.classList.remove('visible');
  }

  // Swipe visual indicator
  function showSwipeIndicator(direction) {
    swipeIndicator.textContent = direction === 'approve' ? '✓' : '✗';
    swipeIndicator.classList.remove('approve', 'reject');
    swipeIndicator.classList.add(direction, 'show');
    setTimeout(() => swipeIndicator.classList.remove('show'), 300);
  }

  // Update border color based on account status
  function updateStatusBorder() {
    statusBorder.classList.remove('approved', 'rejected');
    if (!currentUsername) return;
    if (filterState.allowlist.includes(currentUsername)) {
      statusBorder.classList.add('approved');
    } else if (filterState.blocklist.includes(currentUsername)) {
      statusBorder.classList.add('rejected');
    }
  }

  // The CSS that hides Instagram UI - injected into webview
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
    /* Hide right side buttons/icons */
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
  `;

  // Injection script - runs inside Instagram
  const INJECT_SCRIPT = `
    (function() {
      try {
        // Inject CSS
        if (!document.getElementById('instapump-css')) {
          const style = document.createElement('style');
          style.id = 'instapump-css';
          style.textContent = \`${HIDE_CSS}\`;
          document.head.appendChild(style);
        }

      // Hide elements via JS
      function hideElements() {
        // Hide bottom nav bar (tablist)
        document.querySelectorAll('div[role="tablist"]').forEach(el => {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('height', '0', 'important');
          if (el.parentElement) {
            el.parentElement.style.setProperty('display', 'none', 'important');
          }
        });

        // Hide fixed elements at bottom of screen
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

        // Hide ALL elements on the right 100px of screen
        document.querySelectorAll('svg, div, span, button, a').forEach(el => {
          const rect = el.getBoundingClientRect();
          // If element is in the right 100px and is small (interactive element)
          if (rect.left > window.innerWidth - 100 && rect.width < 100 && rect.height < 100) {
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
          }
        });

        // Expand video container to fill width and add scroll snap
        document.querySelectorAll('video').forEach(video => {
          video.style.setProperty('width', '100vw', 'important');
          video.style.setProperty('height', '100vh', 'important');
          video.style.setProperty('object-fit', 'cover', 'important');
          // Find parent containers and expand them
          let parent = video.parentElement;
          for (let i = 0; i < 10 && parent; i++) {
            const tagName = parent.tagName.toLowerCase();
            if (tagName === 'div' || tagName === 'article') {
              parent.style.setProperty('width', '100vw', 'important');
              parent.style.setProperty('max-width', '100vw', 'important');
            }
            if (tagName === 'article') {
              parent.style.setProperty('height', '100vh', 'important');
              parent.style.setProperty('min-height', '100vh', 'important');
              parent.style.setProperty('scroll-snap-align', 'start', 'important');
              parent.style.setProperty('scroll-snap-stop', 'always', 'important');
            }
            parent = parent.parentElement;
          }
        });

        // Find the main reels scroll container and apply scroll-snap
        // Look for the container that has articles as children
        document.querySelectorAll('article').forEach(article => {
          // Set each article to full viewport height
          article.style.setProperty('height', '100vh', 'important');
          article.style.setProperty('min-height', '100vh', 'important');
          article.style.setProperty('max-height', '100vh', 'important');
          article.style.setProperty('scroll-snap-align', 'start', 'important');
          article.style.setProperty('scroll-snap-stop', 'always', 'important');
          article.style.setProperty('overflow', 'hidden', 'important');

          // Find the scroll container (parent that contains multiple articles)
          let parent = article.parentElement;
          while (parent && parent !== document.body) {
            const children = parent.children;
            let articleCount = 0;
            for (let child of children) {
              if (child.tagName === 'ARTICLE') articleCount++;
            }
            // If this parent has multiple articles, it's likely the scroll container
            if (articleCount >= 1) {
              parent.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
              parent.style.setProperty('overflow-y', 'scroll', 'important');
              parent.style.setProperty('height', '100vh', 'important');
              break;
            }
            parent = parent.parentElement;
          }
        });

        // Also apply to any element with role="feed" which Instagram might use
        document.querySelectorAll('[role="feed"], [role="main"]').forEach(el => {
          el.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
          el.style.setProperty('height', '100vh', 'important');
        });

        // Hide canvas elements (used for some UI)
        document.querySelectorAll('canvas').forEach(canvas => {
          canvas.style.setProperty('display', 'none', 'important');
        });

        // Hide music/audio links
        document.querySelectorAll('a[href*="/audio/"], a[href*="/music/"]').forEach(el => {
          el.style.setProperty('visibility', 'hidden', 'important');
        });

        // Hide small interactive elements on right edge (buttons, spans with counts)
        document.querySelectorAll('span, button').forEach(el => {
          try {
            const rect = el.getBoundingClientRect();
            if (rect.left > window.innerWidth - 100 &&
                rect.width < 60 &&
                rect.height < 60 &&
                rect.height > 5) {
              el.style.setProperty('visibility', 'hidden', 'important');
            }
          } catch(e) {}
        });
      }

      hideElements();

      // Re-run on DOM changes
      if (!window.__instapump_observer) {
        window.__instapump_observer = new MutationObserver(hideElements);
        window.__instapump_observer.observe(document.body, { childList: true, subtree: true });
      }

      } catch(err) {
        console.error('[InstaPump] Error in injection:', err.message, err.stack);
      }
    })();
  `;

  // Inject into webview
  function inject() {
    if (!webviewReady) return;
    webview.executeJavaScript(INJECT_SCRIPT).catch(e => console.log('Inject error:', e));
  }

  // Poll for username and apply mode filtering
  async function pollUsername() {
    if (!webviewReady) return;
    try {
      const username = await webview.executeJavaScript(`
        (function() {
          const links = document.querySelectorAll('a[href^="/"]');
          for (const link of links) {
            const rect = link.getBoundingClientRect();
            if (rect.top > 0 && rect.top < 150 && rect.left < 200) {
              const match = link.href.match(/instagram\\.com\\/([a-zA-Z0-9._]+)\\/?$/);
              if (match && !['reels','explore','p','reel','direct','stories'].includes(match[1])) {
                return match[1].toLowerCase();
              }
            }
          }
          return null;
        })();
      `);
      if (username && username !== currentUsername) {
        currentUsername = username;
        currentUserDisplay.textContent = '@' + username;
        updateStatusBorder();

        // Apply mode-based filtering
        applyModeFilter(username);
      }
    } catch(e) {}
  }

  // Apply filtering based on current mode
  function applyModeFilter(username) {
    if (currentMode === 'discovery') {
      // Discovery mode: skip blocked accounts
      if (filterState.blocklist.includes(username)) {
        showToast('Skipping @' + username);
        setTimeout(() => navigateReel('next'), 300);
      }
    } else {
      // Whitelist mode: only show allowlisted accounts
      if (!filterState.allowlist.includes(username)) {
        showToast('Not whitelisted: @' + username);
        setTimeout(() => navigateReel('next'), 300);
      }
    }
  }

  // WebView ready
  webview.addEventListener('dom-ready', () => {
    loading.classList.add('hidden');
    webviewReady = true;
    inject();
  });

  webview.addEventListener('did-navigate', inject);
  webview.addEventListener('did-navigate-in-page', inject);

  // Poll username every 500ms
  setInterval(pollUsername, 500);

  // Mode toggle functions
  function toggleMode() {
    currentMode = currentMode === 'discovery' ? 'whitelist' : 'discovery';
    updateModeUI();
    showToast(currentMode === 'discovery' ? 'Discovery Mode' : 'Whitelist Mode');
  }

  function updateModeUI() {
    fabMain.classList.remove('discovery', 'whitelist');
    fabMain.classList.add(currentMode);
    fabMain.textContent = currentMode === 'discovery' ? 'D' : 'W';
  }

  // FAB menu toggle
  function toggleFabMenu() {
    fabMenuOpen = !fabMenuOpen;
    fabMenu.classList.toggle('open', fabMenuOpen);
  }

  function closeFabMenu() {
    fabMenuOpen = false;
    fabMenu.classList.remove('open');
  }

  // FAB main button - tap to toggle mode, long press to open menu
  let fabPressTimer = null;
  let fabLongPressed = false;

  fabMain.addEventListener('pointerdown', (e) => {
    fabLongPressed = false;
    fabPressTimer = setTimeout(() => {
      fabLongPressed = true;
      toggleFabMenu();
    }, 400);
  });

  fabMain.addEventListener('pointerup', (e) => {
    clearTimeout(fabPressTimer);
    if (!fabLongPressed) {
      toggleMode();
    }
  });

  fabMain.addEventListener('pointerleave', () => {
    clearTimeout(fabPressTimer);
  });

  // Close FAB menu when clicking outside
  document.addEventListener('click', (e) => {
    if (fabMenuOpen && !e.target.closest('#fab-container')) {
      closeFabMenu();
    }
  });

  // Picker button
  btnPicker.addEventListener('click', () => {
    closeFabMenu();
    enableElementPicker();
  });

  // Logs button
  btnLogs.addEventListener('click', () => {
    closeFabMenu();
    showLogsPanel();
  });

  // Logs panel buttons
  document.getElementById('btn-copy-logs').addEventListener('click', () => {
    navigator.clipboard.writeText(logs.join('\n'));
    showToast('Logs copied');
  });

  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    logs.length = 0;
    updateLogsDisplay();
  });

  document.getElementById('btn-close-logs').addEventListener('click', () => {
    hideLogsPanel();
  });

  // Approve/Reject via swipe (will be added later)
  async function approveCurrentAccount() {
    if (!currentUsername) return showToast('No account detected');
    const result = await window.instapump.approveAccount(currentUsername);
    filterState = { allowlist: result.allowlist, blocklist: result.blocklist };
    updateStatusBorder();
    showToast('Approved @' + currentUsername);
  }

  async function rejectCurrentAccount() {
    if (!currentUsername) return showToast('No account detected');
    const result = await window.instapump.rejectAccount(currentUsername);
    filterState = { allowlist: result.allowlist, blocklist: result.blocklist };
    updateStatusBorder();
    showToast('Rejected @' + currentUsername);
  }

  // Load initial state
  window.instapump.getFilterState().then(state => {
    filterState = { allowlist: state.allowlist || [], blocklist: state.blocklist || [] };
  });

  // Swipe gesture support for approve/reject
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swiping = false;
  const SWIPE_THRESHOLD = 80;

  webview.addEventListener('mousedown', (e) => {
    swipeStartX = e.clientX;
    swipeStartY = e.clientY;
    swiping = true;
  });

  webview.addEventListener('mouseup', (e) => {
    if (!swiping) return;
    swiping = false;

    const deltaX = e.clientX - swipeStartX;
    const deltaY = e.clientY - swipeStartY;

    // Only count horizontal swipes (ignore vertical scrolls)
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      if (deltaX > 0) {
        showSwipeIndicator('approve');
        approveCurrentAccount();
      } else {
        showSwipeIndicator('reject');
        rejectCurrentAccount();
      }
    }
  });

  webview.addEventListener('mouseleave', () => {
    swiping = false;
  });

  // Keyboard shortcuts - handled at Electron renderer level, not inside webview
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') approveCurrentAccount();
    if (e.key === 'ArrowLeft') rejectCurrentAccount();

    // Navigate reels with up/down arrows
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      navigateReel('next');
    }
    if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      navigateReel('prev');
    }

    // M key to toggle mode
    if (e.key === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      toggleMode();
    }

    // P key to enable element picker
    if (e.key === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      enableElementPicker();
    }
  });

  // Element picker - double-tap to save CSS selector
  function enableElementPicker() {
    if (!webviewReady) return;
    const script = `
      (function() {
        if (window.__pickerActive) {
          // Disable picker
          window.__pickerActive = false;
          document.onmousemove = null;
          document.onclick = null;
          if (window.__pickerOverlay) window.__pickerOverlay.remove();
          return 'disabled';
        }

        window.__pickerActive = true;
        window.__savedSelectors = window.__savedSelectors || [];
        window.__lastTap = 0;

        var overlay = document.createElement('div');
        overlay.id = 'picker-overlay';
        overlay.style = 'position:fixed;pointer-events:none;background:rgba(255,149,0,0.3);border:2px solid #ff9500;z-index:999999;display:none;border-radius:4px;';
        document.body.appendChild(overlay);
        window.__pickerOverlay = overlay;

        var lastEl = null;

        function getSelector(el) {
          if (el.id) return '#' + el.id;
          var cls = (el.className || '').toString().trim();
          if (cls) {
            var classes = cls.split(/\\s+/).filter(c => c && !c.startsWith('x')).slice(0,3);
            if (classes.length) return el.tagName.toLowerCase() + '.' + classes.join('.');
          }
          return el.tagName.toLowerCase();
        }

        document.onmousemove = function(e) {
          if (!window.__pickerActive) return;
          var el = document.elementFromPoint(e.clientX, e.clientY);
          if (!el || el === overlay) return;
          var r = el.getBoundingClientRect();
          overlay.style.display = 'block';
          overlay.style.left = r.left + 'px';
          overlay.style.top = r.top + 'px';
          overlay.style.width = r.width + 'px';
          overlay.style.height = r.height + 'px';
          lastEl = el;
        };

        document.onclick = function(e) {
          if (!window.__pickerActive) return;
          var el = lastEl;
          if (!el) return;
          e.preventDefault();
          e.stopPropagation();

          var now = Date.now();
          if (now - window.__lastTap < 300) {
            // Double-tap - save selector
            var selector = getSelector(el);
            window.__savedSelectors.push(selector);
            el.style.outline = '3px solid #34c759';
            console.log('[InstaPump] Saved selector:', selector);
            window.__lastTap = 0;
          } else {
            window.__lastTap = now;
          }
        };

        return 'enabled';
      })();
    `;
    webview.executeJavaScript(script).then((result) => {
      showToast(result === 'enabled' ? 'Picker ON - double-tap to save' : 'Picker OFF');
    }).catch(e => {});
  }

  // Navigate to next/prev reel via webview.executeJavaScript
  function navigateReel(direction) {
    if (!webviewReady) return;

    const script = `
      (function() {
        const articles = Array.from(document.querySelectorAll('article'));
        if (articles.length === 0) return;

        // Find which article is currently most visible
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
        const direction = '${direction}';
        let targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
        targetIdx = Math.max(0, Math.min(targetIdx, articles.length - 1));

        if (articles[targetIdx]) {
          articles[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
          console.log('[InstaPump] Navigated to article', targetIdx);
        }
      })();
    `;

    webview.executeJavaScript(script).catch(e => console.log('Navigate error:', e));
  }
})();
