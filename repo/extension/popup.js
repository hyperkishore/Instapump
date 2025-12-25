// InstaPump Popup Script

document.addEventListener('DOMContentLoaded', () => {
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

  // Load and display lists
  function loadLists() {
    chrome.storage.local.get(['allowlist', 'blocklist', 'filterMode'], (data) => {
      const allowlist = data.allowlist || [];
      const blocklist = data.blocklist || [];
      const filterMode = data.filterMode || 'whitelist';

      // Update counts
      approvedCountEl.textContent = allowlist.length;
      rejectedCountEl.textContent = blocklist.length;

      // Update mode buttons
      updateModeButtons(filterMode);

      // Render allowlist
      if (allowlist.length === 0) {
        allowlistEl.innerHTML = '<div class="empty">No whitelisted accounts yet.<br>Import accounts or approve them while browsing.</div>';
      } else {
        allowlistEl.innerHTML = allowlist.map(username => `
          <div class="list-item">
            <span class="username">@${username}</span>
            <button class="remove" data-username="${username}" data-list="allowlist">&times;</button>
          </div>
        `).join('');
      }
    });
  }

  // Set filter mode
  function setMode(mode) {
    chrome.storage.local.set({ filterMode: mode }, () => {
      updateModeButtons(mode);

      // Also update in active Instagram tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('instagram.com')) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (mode) => {
              localStorage.setItem('instapump_mode', mode);
              if (window.instapump && window.instapump.setMode) {
                window.instapump.setMode(mode);
              }
            },
            args: [mode]
          });
        }
      });

      showStatus(mode === 'whitelist' ? 'Whitelist-only mode enabled' : 'Discovery mode enabled');
    });
  }

  // Import accounts
  function importAccounts() {
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

    chrome.storage.local.get(['allowlist'], (data) => {
      const allowlist = data.allowlist || [];
      let added = 0;

      usernames.forEach(username => {
        if (!allowlist.includes(username)) {
          allowlist.push(username);
          added++;
        }
      });

      chrome.storage.local.set({ allowlist }, () => {
        // Also update localStorage in active Instagram tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].url && tabs[0].url.includes('instagram.com')) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: (list) => {
                localStorage.setItem('instapump_allowlist', JSON.stringify(list));
                // Update UI
                const indicator = document.getElementById('instapump-mode');
                if (indicator) {
                  indicator.textContent = `WHITELIST (${list.length})`;
                }
              },
              args: [allowlist]
            });
          }
        });

        importInput.value = '';
        loadLists();
        showStatus(`Imported ${added} new accounts (${allowlist.length} total)`);
      });
    });
  }

  // Export accounts
  function exportAccounts() {
    chrome.storage.local.get(['allowlist'], (data) => {
      const allowlist = data.allowlist || [];
      if (allowlist.length === 0) {
        showStatus('No accounts to export');
        return;
      }

      const text = allowlist.join('\n');
      importInput.value = text;

      // Copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        showStatus(`Copied ${allowlist.length} accounts to clipboard`);
      }).catch(() => {
        showStatus('Accounts shown in text area');
      });
    });
  }

  // Remove from list
  function removeFromList(username, listName) {
    chrome.storage.local.get([listName], (data) => {
      const list = data[listName] || [];
      const idx = list.indexOf(username);
      if (idx > -1) {
        list.splice(idx, 1);
        chrome.storage.local.set({ [listName]: list }, () => {
          // Also update localStorage in active tab
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('instagram.com')) {
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (key, list) => {
                  localStorage.setItem(key, JSON.stringify(list));
                },
                args: [listName === 'allowlist' ? 'instapump_allowlist' : 'instapump_blocklist', list]
              });
            }
          });
          loadLists();
        });
      }
    });
  }

  // Event listeners
  modeWhitelistBtn.addEventListener('click', () => setMode('whitelist'));
  modeDiscoveryBtn.addEventListener('click', () => setMode('discovery'));
  importBtn.addEventListener('click', importAccounts);
  exportBtn.addEventListener('click', exportAccounts);

  // Event delegation for remove buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove')) {
      const username = e.target.dataset.username;
      const listName = e.target.dataset.list;
      removeFromList(username, listName);
    }
  });

  // Open Reels
  openReelsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.instagram.com/reels/' });
  });

  // Clear All
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all lists?')) {
      chrome.storage.local.set({ allowlist: [], blocklist: [] }, () => {
        // Also clear localStorage in active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].url && tabs[0].url.includes('instagram.com')) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => {
                localStorage.removeItem('instapump_allowlist');
                localStorage.removeItem('instapump_blocklist');
                if (window.instapump && window.instapump.clearLists) {
                  window.instapump.clearLists();
                }
              }
            });
          }
        });
        loadLists();
        showStatus('All lists cleared');
      });
    }
  });

  // Initial load
  loadLists();
});
