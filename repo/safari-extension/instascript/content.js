/**
 * InstaScript - InstaPump Loader for Safari
 *
 * This content script loads InstaPump from GitHub and executes it.
 * Works similar to the InstaPump Loader userscript.
 */

(function() {
  'use strict';

  const SCRIPT_URL = 'https://raw.githubusercontent.com/hyperkishore/Instapump/main/repo/userscript/instapump.user.js';
  const CACHE_KEY = 'instascript_cached_code';
  const VERSION_KEY = 'instascript_cached_version';
  const FETCH_TIMEOUT_MS = 3000;

  // Prevent double execution
  if (window.__instapump_loaded) {
    console.log('[InstaScript] InstaPump already loaded, skipping');
    return;
  }

  // Mark as loading to prevent race conditions
  window.__instapump_loading = true;
  window.__instapump_loader = true; // Signal to main script

  console.log('🎯 [InstaScript] Starting...');

  // Execute the InstaPump code
  function executeCode(code) {
    try {
      // Find the IIFE start (skip userscript header)
      const start = code.indexOf('(function()');
      if (start === -1) {
        console.error('[InstaScript] Invalid script format');
        return false;
      }

      const executableCode = code.substring(start);

      // Execute using Function constructor (content script context)
      const fn = new Function(executableCode);
      fn();

      console.log('[InstaScript] InstaPump executed successfully');
      return true;
    } catch (e) {
      console.error('[InstaScript] Execution error:', e);
      return false;
    }
  }

  // Parse version from script
  function parseVersion(code) {
    const match = code.match(/@version\s+([\d.]+)/);
    return match ? match[1] : '0.0.0';
  }

  // Get cached code
  function getFromCache() {
    try {
      return localStorage.getItem(CACHE_KEY);
    } catch (e) {
      return null;
    }
  }

  // Save to cache
  function saveToCache(code) {
    try {
      const version = parseVersion(code);
      localStorage.setItem(CACHE_KEY, code);
      localStorage.setItem(VERSION_KEY, version);
      console.log(`[InstaScript] Cached v${version}`);
    } catch (e) {
      console.warn('[InstaScript] Cache save failed:', e.message);
    }
  }

  // Get cached version
  function getCachedVersion() {
    try {
      return localStorage.getItem(VERSION_KEY) || '0.0.0';
    } catch (e) {
      return '0.0.0';
    }
  }

  // Fetch latest from GitHub
  async function fetchLatest() {
    try {
      const response = await fetch(SCRIPT_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const code = await response.text();

      // Validate
      if (!code.includes('InstaPump') || !code.includes('@version')) {
        throw new Error('Invalid script content');
      }

      return code;
    } catch (e) {
      console.error('[InstaScript] Fetch failed:', e.message);
      return null;
    }
  }

  // Fetch with timeout
  async function fetchWithTimeout(timeoutMs) {
    return Promise.race([
      fetchLatest(),
      new Promise(resolve => setTimeout(() => resolve(null), timeoutMs))
    ]);
  }

  // Compare versions
  function isNewer(v1, v2) {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return true;
      if (n1 < n2) return false;
    }
    return false;
  }

  // Show toast notification
  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.opacity = '1');
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Main loader logic
  async function main() {
    const cachedCode = getFromCache();
    const cachedVersion = getCachedVersion();

    console.log(`[InstaScript] Cache: ${cachedCode ? `v${cachedVersion}` : 'empty'}`);

    // Try to fetch latest first
    const latestCode = await fetchWithTimeout(FETCH_TIMEOUT_MS);

    if (latestCode) {
      const latestVersion = parseVersion(latestCode);
      console.log(`[InstaScript] Fetched v${latestVersion}`);

      saveToCache(latestCode);
      executeCode(latestCode);

      // Show update notification if version changed
      if (cachedVersion !== '0.0.0' && isNewer(latestVersion, cachedVersion)) {
        const notify = () => showToast(`InstaPump updated to v${latestVersion}`);
        if (document.body) notify();
        else document.addEventListener('DOMContentLoaded', notify);
      }
    } else if (cachedCode) {
      console.log(`[InstaScript] Using cached v${cachedVersion}`);
      executeCode(cachedCode);

      const notify = () => showToast('InstaPump: Using cached version');
      if (document.body) notify();
      else document.addEventListener('DOMContentLoaded', notify);
    } else {
      console.error('[InstaScript] No code available - first load requires network');
      const showError = () => showToast('InstaScript: Connect to load InstaPump');
      if (document.body) showError();
      else document.addEventListener('DOMContentLoaded', showError);
    }
  }

  // Start
  main();
})();
