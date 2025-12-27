// ==UserScript==
// @name         InstaPump Loader
// @namespace    https://instapump.app
// @version      1.0.0
// @description  Auto-updating loader for InstaPump
// @author       InstaPump
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const SCRIPT_URL = 'https://raw.githubusercontent.com/hyperkishore/Instapump/main/repo/userscript/instapump.user.js';
  const CACHE_KEY = 'instapump_cached_code';
  const VERSION_KEY = 'instapump_cached_version';
  const LOADER_VERSION = '1.0.0';

  // Prevent double execution
  if (window.__instapump_loaded) return;
  window.__instapump_loaded = true;
  window.__instapump_loader = true;  // Signal to main script that loader is managing updates

  console.log(`🚀 InstaPump Loader v${LOADER_VERSION}`);

  // Execute code in content script context (bypasses page CSP)
  function executeCode(code) {
    try {
      // Extract the IIFE from the userscript (skip metadata header)
      const codeStart = code.indexOf('(function()');
      console.log('[InstaPump Loader] Code start index:', codeStart);
      if (codeStart === -1) {
        console.error('[InstaPump Loader] Invalid script format - could not find (function()');
        console.log('[InstaPump Loader] First 500 chars:', code.substring(0, 500));
        return false;
      }
      const executableCode = code.substring(codeStart);
      console.log('[InstaPump Loader] Executing code, length:', executableCode.length);

      // Execute in content script context using Function constructor
      // This works because content scripts have their own isolated world
      // not subject to the page's CSP
      const fn = new Function(executableCode);
      fn();
      console.log('[InstaPump Loader] Code executed via Function constructor');

      return true;
    } catch (e) {
      console.error('[InstaPump Loader] Execution error:', e);
      console.error('[InstaPump Loader] Stack:', e.stack);
      return false;
    }
  }

  // Parse version from script
  function parseVersion(code) {
    const match = code.match(/@version\s+([\d.]+)/);
    return match ? match[1] : '0.0.0';
  }

  // Show toast message
  function showToast(message, isError = false) {
    const existing = document.getElementById('instapump-loader-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'instapump-loader-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: ${isError ? '#ff3b30' : 'rgba(0,0,0,0.9)'};
      color: white;
      padding: 12px 20px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.opacity = '1');
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Fetch latest from GitHub
  async function fetchLatest() {
    console.log('[InstaPump Loader] Fetching from:', SCRIPT_URL);
    try {
      const response = await fetch(SCRIPT_URL, { cache: 'no-store' });
      console.log('[InstaPump Loader] Fetch response status:', response.status);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const code = await response.text();
      console.log('[InstaPump Loader] Fetched code length:', code.length);

      // Validate it looks like our script
      if (!code.includes('InstaPump') || !code.includes('@version')) {
        throw new Error('Invalid script content');
      }
      return code;
    } catch (e) {
      console.error('[InstaPump Loader] Fetch failed:', e.message);
      return null;
    }
  }

  // Save to cache
  function saveToCache(code) {
    try {
      const version = parseVersion(code);
      localStorage.setItem(CACHE_KEY, code);
      localStorage.setItem(VERSION_KEY, version);
      console.log(`[InstaPump Loader] Cached v${version}`);
      return true;
    } catch (e) {
      console.warn('[InstaPump Loader] Cache save failed:', e.message);
      return false;
    }
  }

  // Get cached code
  function getFromCache() {
    try {
      return localStorage.getItem(CACHE_KEY);
    } catch (e) {
      return null;
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

  // Compare versions (returns true if v1 > v2)
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

  // Main loader logic
  async function main() {
    console.log('[InstaPump Loader] main() starting...');
    const cachedCode = getFromCache();
    const cachedVersion = getCachedVersion();
    console.log('[InstaPump Loader] Cache status:', cachedCode ? `found v${cachedVersion}` : 'empty');

    // If we have cache, run it immediately
    if (cachedCode) {
      console.log(`[InstaPump Loader] Running cached v${cachedVersion}`);
      const success = executeCode(cachedCode);
      console.log('[InstaPump Loader] Cached code execution:', success ? 'SUCCESS' : 'FAILED');

      // Background update check (don't block)
      fetchLatest().then(latestCode => {
        if (latestCode) {
          const latestVersion = parseVersion(latestCode);
          if (isNewer(latestVersion, cachedVersion)) {
            saveToCache(latestCode);
            // Wait for DOM to be ready for toast
            if (document.body) {
              showToast(`Update v${latestVersion} ready - refresh to apply`);
            } else {
              document.addEventListener('DOMContentLoaded', () => {
                showToast(`Update v${latestVersion} ready - refresh to apply`);
              });
            }
          }
        }
      });
    } else {
      // First time - must fetch
      console.log('[InstaPump Loader] First run - no cache, fetching from GitHub...');
      const code = await fetchLatest();
      console.log('[InstaPump Loader] Fetch result:', code ? `got ${code.length} bytes` : 'FAILED');

      if (code) {
        saveToCache(code);
        const success = executeCode(code);
        console.log('[InstaPump Loader] Fresh code execution:', success ? 'SUCCESS' : 'FAILED');
      } else {
        // Fetch failed, no cache - show error
        const showError = () => {
          showToast('InstaPump: Connect to internet for first setup', true);
        };
        if (document.body) {
          showError();
        } else {
          document.addEventListener('DOMContentLoaded', showError);
        }
      }
    }
  }

  // Start
  main();
})();
