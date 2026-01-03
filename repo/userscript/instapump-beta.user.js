// ==UserScript==
// @name         InstaPump BETA - Clean Reels Experience
// @namespace    https://instapump.app
// @version      1.0.0
// @description  BETA version of InstaPump - Test new features before stable release
// @author       InstaPump
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/hyperkishore/Instapump/beta/repo/userscript/instapump-beta.user.js
// @downloadURL  https://raw.githubusercontent.com/hyperkishore/Instapump/beta/repo/userscript/instapump-beta.user.js
// ==/UserScript==

/**
 * InstaPump BETA Loader
 *
 * This loader fetches the latest beta version from GitHub's beta branch.
 * Beta testers get early access to new features and bug fixes.
 *
 * Installation:
 * 1. Install this loader script in Userscripts/Tampermonkey
 * 2. New beta versions will auto-load on page refresh
 *
 * Reporting Issues:
 * - GitHub Issues: https://github.com/hyperkishore/Instapump/issues
 * - Tag issues with [BETA] in the title
 */

(function() {
  'use strict';

  // Prevent double execution
  if (window.__instapump_beta_loader) return;
  window.__instapump_beta_loader = true;

  const BETA_SCRIPT_URL = 'https://raw.githubusercontent.com/hyperkishore/Instapump/beta/repo/userscript/instapump.user.js';
  const CACHE_KEY = 'instapump_beta_cached_code';
  const VERSION_KEY = 'instapump_beta_cached_version';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (shorter for beta)

  console.log('[InstaPump BETA] Loader starting...');

  // Check if on reels page
  function isOnReelsPage() {
    const path = window.location.pathname;
    return path.startsWith('/reels') || path.startsWith('/reel/');
  }

  if (!isOnReelsPage()) {
    return;
  }

  // Execute cached code immediately
  const cachedCode = localStorage.getItem(CACHE_KEY);
  const cachedVersion = localStorage.getItem(VERSION_KEY);

  if (cachedCode) {
    console.log(`[InstaPump BETA] Running cached version: ${cachedVersion || 'unknown'}`);
    try {
      window.__instapump_loader = true; // Signal to main script
      const script = document.createElement('script');
      script.textContent = cachedCode;
      document.documentElement.appendChild(script);
    } catch (e) {
      console.error('[InstaPump BETA] Failed to execute cached code:', e);
    }
  } else {
    console.log('[InstaPump BETA] No cache found, fetching...');
  }

  // Fetch latest in background
  fetch(BETA_SCRIPT_URL + '?t=' + Date.now(), {
    cache: 'no-store'
  })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.text();
    })
    .then(code => {
      // Extract version from fetched code
      const versionMatch = code.match(/const VERSION = '([^']+)'/);
      const newVersion = versionMatch ? versionMatch[1] : 'unknown';
      const oldVersion = cachedVersion || 'none';

      console.log(`[InstaPump BETA] Fetched version: ${newVersion} (cached: ${oldVersion})`);

      // Always update cache for beta (more aggressive updates)
      localStorage.setItem(CACHE_KEY, code);
      localStorage.setItem(VERSION_KEY, newVersion);

      if (newVersion !== oldVersion) {
        console.log(`[InstaPump BETA] New beta version available! Refresh to apply.`);

        // Show notification toast
        if (document.body) {
          showBetaUpdateToast(oldVersion, newVersion);
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            showBetaUpdateToast(oldVersion, newVersion);
          });
        }
      }

      // If no cache was available, execute now
      if (!cachedCode) {
        window.__instapump_loader = true;
        const script = document.createElement('script');
        script.textContent = code;
        document.documentElement.appendChild(script);
      }
    })
    .catch(err => {
      console.warn('[InstaPump BETA] Failed to fetch latest:', err);
      // If no cache, we're stuck
      if (!cachedCode) {
        console.error('[InstaPump BETA] No cached version and fetch failed. InstaPump will not run.');
      }
    });

  function showBetaUpdateToast(oldVersion, newVersion) {
    const toast = document.createElement('div');
    toast.id = 'instapump-beta-toast';
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ff6b6b, #ff8e53);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 600;
        z-index: 9999999;
        box-shadow: 0 4px 20px rgba(255, 107, 107, 0.4);
        cursor: pointer;
      " onclick="location.reload()">
        🧪 BETA Update: v${oldVersion} → v${newVersion}<br>
        <span style="font-size: 12px; opacity: 0.9;">Tap to refresh</span>
      </div>
    `;
    document.body.appendChild(toast);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      toast.style.transition = 'opacity 0.5s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 10000);
  }
})();
