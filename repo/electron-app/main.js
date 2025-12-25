// InstaPump - Electron Main Process
// This mirrors iOS WKWebView architecture

const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Persistent storage (equivalent to iOS UserDefaults)
const store = new Store({
  name: 'instapump-data',
  defaults: {
    allowlist: [],
    blocklist: [],
    settings: {
      autoSkip: true,
      showOverlay: true
    }
  }
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 390,  // iPhone 14 width
    height: 844, // iPhone 14 height
    resizable: true,
    minWidth: 390,
    minHeight: 844,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 }
  });

  // Load the renderer (app shell)
  mainWindow.loadFile('renderer/index.html');

  // Open DevTools for the webview (Instagram) once it's ready
  mainWindow.webContents.on('did-finish-load', () => {
    // Get the webview and open its DevTools
    mainWindow.webContents.executeJavaScript(`
      const wv = document.getElementById('instagram-webview');
      if (wv) {
        wv.addEventListener('dom-ready', () => {
          wv.openDevTools({ mode: 'detach' });
        });
        // If already ready, open now
        if (wv.getWebContentsId) {
          wv.openDevTools({ mode: 'detach' });
        }
      }
    `);
  });
}

// IPC handlers (equivalent to iOS WKScriptMessageHandler)
ipcMain.handle('get-filter-state', () => {
  return {
    allowlist: store.get('allowlist'),
    blocklist: store.get('blocklist'),
    settings: store.get('settings')
  };
});

ipcMain.handle('approve-account', (event, username) => {
  const allowlist = store.get('allowlist');
  const blocklist = store.get('blocklist');

  // Add to allowlist if not present
  if (!allowlist.includes(username)) {
    allowlist.push(username);
    store.set('allowlist', allowlist);
  }

  // Remove from blocklist if present
  const blockIdx = blocklist.indexOf(username);
  if (blockIdx > -1) {
    blocklist.splice(blockIdx, 1);
    store.set('blocklist', blocklist);
  }

  console.log(`[InstaPump] Approved: @${username}`);
  return { allowlist, blocklist };
});

ipcMain.handle('reject-account', (event, username) => {
  const allowlist = store.get('allowlist');
  const blocklist = store.get('blocklist');

  // Add to blocklist if not present
  if (!blocklist.includes(username)) {
    blocklist.push(username);
    store.set('blocklist', blocklist);
  }

  // Remove from allowlist if present
  const allowIdx = allowlist.indexOf(username);
  if (allowIdx > -1) {
    allowlist.splice(allowIdx, 1);
    store.set('allowlist', allowlist);
  }

  console.log(`[InstaPump] Rejected: @${username}`);
  return { allowlist, blocklist };
});

ipcMain.handle('update-settings', (event, settings) => {
  store.set('settings', { ...store.get('settings'), ...settings });
  return store.get('settings');
});

ipcMain.handle('clear-lists', () => {
  store.set('allowlist', []);
  store.set('blocklist', []);
  return { allowlist: [], blocklist: [] };
});

ipcMain.handle('export-data', () => {
  return {
    allowlist: store.get('allowlist'),
    blocklist: store.get('blocklist'),
    settings: store.get('settings'),
    exportedAt: new Date().toISOString()
  };
});

app.whenReady().then(() => {
  // Use default Chrome user agent (mobile UA was causing issues)
  // Instagram serves better on desktop in Electron

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
