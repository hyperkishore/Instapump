/**
 * InstaPump Safari Web Extension - Background Service Worker
 * Minimal implementation for Safari Web Extensions
 */

// Log extension load
console.log('[InstaPump] Background service worker loaded');

// Handle extension install/update
if (typeof browser !== 'undefined' && browser.runtime) {
  browser.runtime.onInstalled.addListener((details) => {
    console.log('[InstaPump] Extension installed/updated:', details.reason);
  });
}
