/**
 * Core Functions Tests
 * Tests for storage, mode toggle, and list management
 */

const fs = require('fs');
const path = require('path');

// Extract functions from userscript for testing
const userscriptPath = path.join(__dirname, '../userscript/instapump.user.js');
const userscript = fs.readFileSync(userscriptPath, 'utf8');

describe('Storage Keys', () => {

  test('All storage keys are defined', () => {
    expect(userscript).toContain("STORAGE_KEY_ALLOWLIST = 'instapump_allowlist'");
    expect(userscript).toContain("STORAGE_KEY_BLOCKLIST = 'instapump_blocklist'");
    expect(userscript).toContain("STORAGE_KEY_MODE = 'instapump_mode'");
  });

  test('Storage keys use consistent prefix', () => {
    const storageKeys = userscript.match(/STORAGE_KEY_\w+\s*=\s*'([^']+)'/g);
    expect(storageKeys).toBeTruthy();

    storageKeys.forEach(key => {
      const value = key.match(/'([^']+)'/)[1];
      expect(value).toMatch(/^instapump_/);
    });
  });
});

describe('Mode Logic', () => {

  test('Two modes are defined: discovery and whitelist', () => {
    expect(userscript).toContain("'discovery'");
    expect(userscript).toContain("'whitelist'");
  });

  test('Mode toggle function exists', () => {
    expect(userscript).toContain('function toggleMode()');
  });

  test('Mode is persisted to localStorage', () => {
    expect(userscript).toMatch(/localStorage\.setItem\(STORAGE_KEY_MODE/);
  });
});

describe('List Functions', () => {

  test('getAllowlist function exists', () => {
    expect(userscript).toContain('function getAllowlist()');
  });

  test('getBlocklist function exists', () => {
    expect(userscript).toContain('function getBlocklist()');
  });

  test('saveAllowlist function exists', () => {
    expect(userscript).toContain('function saveAllowlist(');
  });

  test('saveBlocklist function exists', () => {
    expect(userscript).toContain('function saveBlocklist(');
  });

  test('List functions use JSON for storage', () => {
    expect(userscript).toMatch(/JSON\.parse\(localStorage\.getItem\(STORAGE_KEY_ALLOWLIST\)/);
    expect(userscript).toMatch(/JSON\.stringify/);
  });
});

describe('Navigation', () => {

  test('navigateReel function exists', () => {
    expect(userscript).toContain('function navigateReel(');
  });

  test('Navigation supports next and prev directions', () => {
    expect(userscript).toMatch(/direction\s*===?\s*'next'/);
    expect(userscript).toMatch(/direction\s*===?\s*'prev'/);
  });

  test('Navigation uses scrollIntoView', () => {
    expect(userscript).toContain('scrollIntoView');
  });
});

describe('UI Elements', () => {

  test('FAB creation function exists', () => {
    expect(userscript).toContain('function createUI()');
    expect(userscript).toContain("id = 'instapump-fab'");
  });

  test('Toast function exists', () => {
    expect(userscript).toContain('function showToast(');
  });

  test('All required icons are defined', () => {
    expect(userscript).toContain('ICONS.compass');
    expect(userscript).toContain('ICONS.bullseye');
    expect(userscript).toContain('ICONS.stats');
    expect(userscript).toContain('ICONS.lists');
  });
});

describe('Event Handlers', () => {

  test('Keyboard shortcuts are registered', () => {
    expect(userscript).toContain("e.key === 'ArrowRight'");
    expect(userscript).toContain("e.key === 'ArrowLeft'");
    expect(userscript).toContain("e.key === 'ArrowDown'");
    expect(userscript).toContain("e.key === 'ArrowUp'");
  });

  test('Touch events are handled', () => {
    expect(userscript).toContain("'touchstart'");
    expect(userscript).toContain("'touchend'");
  });
});

describe('Auto-Advance', () => {

  test('Auto-advance debounce exists', () => {
    expect(userscript).toContain('function debounceAdvance(');
  });

  test('Auto-advance uses timestamp validation', () => {
    expect(userscript).toMatch(/nearEndTimestamp/);
    expect(userscript).toMatch(/2000/); // 2 second threshold
  });

  test('Video events are tracked', () => {
    expect(userscript).toContain("'timeupdate'");
    expect(userscript).toContain("'ended'");
    expect(userscript).toContain("'loadstart'");
  });
});
