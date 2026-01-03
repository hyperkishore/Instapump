/**
 * InstaPump Safari Extension Popup Script
 * Uses browser.* APIs for Safari Web Extensions
 */

document.addEventListener('DOMContentLoaded', async () => {
  const allowlistEl = document.getElementById('allowlist');
  const approvedCountEl = document.getElementById('approved-count');
  const rejectedCountEl = document.getElementById('rejected-count');
  const openReelsBtn = document.getElementById('open-reels');
  const clearAllBtn = document.getElementById('clear-all');
  const importInput = document.getElementById('import-input');
  const importBtn = document.getElementById('import-btn');
  const exportBtn = document.getElementById('export-btn');
  const statusMsg = document.getElementById('status-msg');
  const modeWhitelistBtn = document.getElementById('mode-whitelist');
  const modeDiscoveryBtn = document.getElementById('mode-discovery');
  const versionEl = document.getElementById('version');

  // Show status message
  function showStatus(msg, duration = 2000) {
    statusMsg.textContent = msg;
    statusMsg.classList.add('visible');
    setTimeout(() => statusMsg.classList.remove('visible'), duration);
  }

  // Update mode buttons
  function updateModeButtons(mode) {
    modeWhitelistBtn.classList.remove('active');
    modeDiscoveryBtn.classList.remove('active', 'discovery');

    if (mode === 'whitelist') {
      modeWhitelistBtn.classList.add('active');
    } else {
      modeDiscoveryBtn.classList.add('active', 'discovery');
    }
  }

  // Send message to content script in active Instagram tab
  async function sendToContentScript(message) {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('instagram.com')) {
        const response = await browser.tabs.sendMessage(tabs[0].id, message);
        return response;
      }
    } catch (err) {
      console.log('[InstaPump Popup] Could not reach content script:', err.message);
    }
    return null;
  }

  // Load state from content script
  async function loadState() {
    const state = await sendToContentScript({ type: 'GET_STATE' });

    if (state) {
      // Update counts
      approvedCountEl.textContent = state.allowlist.length;
      rejectedCountEl.textContent = state.blocklist.length;

      // Update mode buttons
      updateModeButtons(state.mode);

      // Update version
      if (state.version) {
        versionEl.textContent = `v${state.version}`;
      }

      // Render allowlist
      renderAllowlist(state.allowlist);
    } else {
      // Content script not reachable - show guidance
      allowlistEl.innerHTML = '<div class="empty">Open Instagram Reels in Safari to use InstaPump.<br><br>Tap "Open Reels" below.</div>';
    }
  }

  // Render allowlist
  function renderAllowlist(allowlist) {
    if (allowlist.length === 0) {
      allowlistEl.innerHTML = '<div class="empty">No whitelisted accounts yet.<br>Import accounts or approve them while browsing.</div>';
    } else {
      allowlistEl.innerHTML = allowlist.map(username => `
        <div class="list-item">
          <span class="username">@${username}</span>
          <button class="remove" data-username="${username}">&times;</button>
        </div>
      `).join('');
    }
  }

  // Set mode
  async function setMode(mode) {
    const result = await sendToContentScript({ type: 'SET_MODE', mode });
    if (result && result.success) {
      updateModeButtons(mode);
      showStatus(mode === 'whitelist' ? 'Whitelist-only mode enabled' : 'Discovery mode enabled');
    } else {
      showStatus('Open Instagram Reels first');
    }
  }

  // Import accounts
  async function importAccounts() {
    const input = importInput.value.trim();
    if (!input) {
      showStatus('Please enter some usernames');
      return;
    }

    // Parse usernames (handle newlines, commas, spaces, @ symbols)
    const usernames = input
      .split(/[\n,\s]+/)
      .map(u => u.trim().toLowerCase().replace(/^@/, ''))
      .filter(u => u.length > 0 && /^[a-zA-Z0-9._]+$/.test(u));

    if (usernames.length === 0) {
      showStatus('No valid usernames found');
      return;
    }

    const result = await sendToContentScript({ type: 'IMPORT_ALLOWLIST', usernames });
    if (result) {
      importInput.value = '';
      loadState();
      showStatus(`Imported ${result.added} new accounts (${result.total} total)`);
    } else {
      showStatus('Open Instagram Reels first');
    }
  }

  // Export accounts
  async function exportAccounts() {
    const state = await sendToContentScript({ type: 'GET_STATE' });
    if (state && state.allowlist.length > 0) {
      const text = state.allowlist.join('\n');
      importInput.value = text;

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        showStatus(`Copied ${state.allowlist.length} accounts to clipboard`);
      } catch {
        showStatus('Accounts shown in text area');
      }
    } else if (state) {
      showStatus('No accounts to export');
    } else {
      showStatus('Open Instagram Reels first');
    }
  }

  // Remove from list
  async function removeFromList(username) {
    const result = await sendToContentScript({
      type: 'REMOVE_FROM_LIST',
      listType: 'allowlist',
      username
    });
    if (result && result.success) {
      loadState();
    }
  }

  // Event listeners
  modeWhitelistBtn.addEventListener('click', () => setMode('whitelist'));
  modeDiscoveryBtn.addEventListener('click', () => setMode('discovery'));
  importBtn.addEventListener('click', importAccounts);
  exportBtn.addEventListener('click', exportAccounts);

  // Event delegation for remove buttons
  allowlistEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove')) {
      const username = e.target.dataset.username;
      removeFromList(username);
    }
  });

  // Open Reels
  openReelsBtn.addEventListener('click', () => {
    browser.tabs.create({ url: 'https://www.instagram.com/reels/' });
  });

  // Clear All
  clearAllBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all lists?')) {
      const result = await sendToContentScript({ type: 'CLEAR_LISTS' });
      if (result && result.success) {
        loadState();
        showStatus('All lists cleared');
      } else {
        showStatus('Open Instagram Reels first');
      }
    }
  });

  // Initial load
  loadState();
});
