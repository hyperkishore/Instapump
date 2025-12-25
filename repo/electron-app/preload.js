// InstaPump - Preload Script (Bridge between Electron and WebView)
// This file exposes APIs to the renderer process
// Equivalent to iOS WKScriptMessageHandler bridge

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('instapump', {
  // Get current filter state
  getFilterState: () => ipcRenderer.invoke('get-filter-state'),

  // Approve an account
  approveAccount: (username) => ipcRenderer.invoke('approve-account', username),

  // Reject an account
  rejectAccount: (username) => ipcRenderer.invoke('reject-account', username),

  // Update settings
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),

  // Clear all lists
  clearLists: () => ipcRenderer.invoke('clear-lists'),

  // Export data (for backup/iOS migration)
  exportData: () => ipcRenderer.invoke('export-data'),

  // Listen for state updates from main process
  onStateUpdate: (callback) => {
    ipcRenderer.on('state-update', (event, data) => callback(data));
  }
});
