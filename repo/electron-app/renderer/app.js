// InstaPump - Simplified Version
(function() {
  'use strict';

  const webview = document.getElementById('instagram-webview');
  const loading = document.getElementById('loading');
  const btnApprove = document.getElementById('btn-approve');
  const btnReject = document.getElementById('btn-reject');
  const btnInspect = document.getElementById('btn-inspect');
  const currentUserDisplay = document.getElementById('current-user');
  const statusBorder = document.getElementById('status-border');
  const toast = document.getElementById('toast');

  let webviewReady = false;
  let currentUsername = null;
  let filterState = { allowlist: [], blocklist: [] };

  // Simple toast
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
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

  // Poll for username
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
      }
    } catch(e) {}
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

  // Approve/Reject buttons
  btnApprove.addEventListener('click', async () => {
    if (!currentUsername) return showToast('No account detected');
    const result = await window.instapump.approveAccount(currentUsername);
    filterState = { allowlist: result.allowlist, blocklist: result.blocklist };
    updateStatusBorder();
    showToast('Approved @' + currentUsername);
  });

  btnReject.addEventListener('click', async () => {
    if (!currentUsername) return showToast('No account detected');
    const result = await window.instapump.rejectAccount(currentUsername);
    filterState = { allowlist: result.allowlist, blocklist: result.blocklist };
    updateStatusBorder();
    showToast('Rejected @' + currentUsername);
  });

  // Load initial state
  window.instapump.getFilterState().then(state => {
    filterState = { allowlist: state.allowlist || [], blocklist: state.blocklist || [] };
  });

  // Inspect button
  btnInspect.addEventListener('click', () => {
    enableHoverInspector();
  });

  // Keyboard shortcuts - handled at Electron renderer level, not inside webview
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') btnApprove.click();
    if (e.key === 'ArrowLeft') btnReject.click();

    // Navigate reels with up/down arrows
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      navigateReel('next');
    }
    if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      navigateReel('prev');
    }

    // Ctrl + I or just 'i' key to enable hover inspector
    if ((e.ctrlKey && e.key === 'i') || (e.key === 'i' && !e.metaKey && !e.altKey)) {
      e.preventDefault();
      enableHoverInspector();
    }
  });

  // Hover inspector for debugging
  function enableHoverInspector() {
    if (!webviewReady) return;
    const script = `var saved=[];var lastEl=null;var overlay=document.createElement('div');overlay.id='inspect-overlay';overlay.style='position:fixed;pointer-events:none;background:rgba(100,100,100,0.5);border:2px solid red;z-index:999999;display:none;';document.body.appendChild(overlay);document.onmousemove=function(e){var el=document.elementFromPoint(e.clientX,e.clientY);if(!el||el===overlay)return;if(el.dataset.saved){overlay.style.display='none';return;}var r=el.getBoundingClientRect();overlay.style.display='block';overlay.style.left=r.left+'px';overlay.style.top=r.top+'px';overlay.style.width=r.width+'px';overlay.style.height=r.height+'px';lastEl=el;};document.onclick=function(e){var el=lastEl;if(!el)return;e.preventDefault();e.stopPropagation();var cls=(el.className||'').toString();saved.push({tag:el.tagName,class:cls,el:el});el.dataset.saved='1';el.style.outline='3px solid yellow';el.style.background='rgba(255,255,0,0.3)';console.log('SAVED #'+saved.length+':',{tag:el.tagName,class:cls,el:el});};window.showSaved=function(){saved.forEach(function(s,i){console.log(i+1,s);});};window.getSaved=function(){return saved;};window.analyze=function(){saved.forEach(function(s,i){var el=s.el;var r=el.getBoundingClientRect();var cs=getComputedStyle(el);console.log('--- SAVED #'+(i+1)+' ('+s.tag+') ---');console.log('Size:',Math.round(r.width)+'x'+Math.round(r.height));console.log('Position:',Math.round(r.left)+','+Math.round(r.top));console.log('Padding:',cs.padding);console.log('Margin:',cs.margin);console.log('Display:',cs.display);console.log('CSS Position:',cs.position);console.log('Overflow:',cs.overflow);});};`;
    webview.executeJavaScript(script).then(() => {
      showToast('Inspector ON - run analyze() to inspect');
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
