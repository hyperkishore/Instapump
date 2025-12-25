// InstaPump Background Script
// Auto-reload extension when Instagram page is refreshed

// Track if we just reloaded to prevent infinite loop
let justReloaded = false;

// On extension startup, set flag and clear it after a short delay
chrome.runtime.onInstalled.addListener(() => {
  justReloaded = true;
  setTimeout(() => { justReloaded = false; }, 3000);
});

chrome.runtime.onStartup.addListener(() => {
  justReloaded = true;
  setTimeout(() => { justReloaded = false; }, 3000);
});

// Listen for Instagram page navigation
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Only for main frame (not iframes)
  if (details.frameId !== 0) return;

  // Only for Instagram
  if (!details.url.includes('instagram.com')) return;

  // Don't reload if we just reloaded (prevents infinite loop)
  if (justReloaded) return;

  // Reload the extension
  console.log('[InstaPump] Instagram navigation detected, reloading extension...');
  chrome.runtime.reload();
}, { url: [{ hostContains: 'instagram.com' }] });
