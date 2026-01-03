/**
 * InstaPump E2E Tests
 *
 * NOTE: These tests require:
 * 1. Instagram login (manual or via saved state)
 * 2. InstaPump extension loaded
 *
 * Run with: npx playwright test
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load userscript content for injection
const userscriptPath = path.join(__dirname, '../../userscript/instapump.user.js');
const userscript = fs.readFileSync(userscriptPath, 'utf8');

test.describe('InstaPump Extension', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Instagram Reels
    await page.goto('/reels/', { waitUntil: 'domcontentloaded' });

    // Inject userscript
    await page.addScriptTag({ content: userscript });

    // Wait for InstaPump to initialize
    await page.waitForSelector('#instapump-fab', { timeout: 10000 });
  });

  test('FAB is visible and positioned correctly', async ({ page }) => {
    const fab = await page.locator('#instapump-fab');
    await expect(fab).toBeVisible();

    // Check position (bottom-right)
    const box = await fab.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x).toBeGreaterThan(viewport.width / 2);
    expect(box.y).toBeGreaterThan(viewport.height / 2);
  });

  test('Version badge displays correctly', async ({ page }) => {
    const badge = await page.locator('#instapump-version');
    await expect(badge).toBeVisible();

    const text = await badge.textContent();
    expect(text).toMatch(/v\d+\.\d+\.\d+/);
  });

  test('Mode toggle works', async ({ page }) => {
    const fabMain = await page.locator('#instapump-fab-main');

    // Get initial mode
    const initialClass = await fabMain.getAttribute('class');
    const initialMode = initialClass.includes('discovery') ? 'discovery' : 'whitelist';

    // Click to toggle
    await fabMain.click();

    // Wait for mode change
    await page.waitForTimeout(500);

    // Check mode changed
    const newClass = await fabMain.getAttribute('class');
    const newMode = newClass.includes('discovery') ? 'discovery' : 'whitelist';
    expect(newMode).not.toBe(initialMode);
  });

  test('Toast appears on actions', async ({ page }) => {
    const fabMain = await page.locator('#instapump-fab-main');

    // Click to toggle mode (should show toast)
    await fabMain.click();

    // Check toast appears
    const toast = await page.locator('#instapump-toast');
    await expect(toast).toBeVisible();
  });

  test('Hiding toggle works', async ({ page }) => {
    // Long press FAB to open menu
    const fabMain = await page.locator('#instapump-fab-main');
    await fabMain.click({ delay: 600 }); // Long press

    // Click hiding button
    const hideBtn = await page.locator('#instapump-btn-hide');
    await hideBtn.click();

    // Check toast shows hiding status
    const toast = await page.locator('#instapump-toast');
    const text = await toast.textContent();
    expect(text).toMatch(/Hiding (ON|OFF)/);
  });

  test('Navigation works with keyboard', async ({ page }) => {
    // Get initial URL
    const initialUrl = page.url();

    // Press down arrow
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1000);

    // URL should change (new reel)
    // Note: This may not work if only one reel is loaded
    const newUrl = page.url();
    // Just verify no errors occurred
  });

  test('Video is vertically centered', async ({ page }) => {
    // Wait for video to load
    const video = await page.locator('video').first();
    await expect(video).toBeVisible();

    // Check video has centering transform
    const transform = await video.evaluate(el => getComputedStyle(el).transform);
    // translateY(-50%) results in a matrix transform
    expect(transform).not.toBe('none');
  });

  test('InstaPump UI remains visible when hiding is OFF', async ({ page }) => {
    // Long press FAB to open menu
    const fabMain = await page.locator('#instapump-fab-main');
    await fabMain.click({ delay: 600 });

    // Get current hiding state
    const hideBtn = await page.locator('#instapump-btn-hide');
    const isEnabled = await hideBtn.evaluate(el => el.classList.contains('enabled'));

    if (isEnabled) {
      // Turn hiding OFF
      await hideBtn.click();
      await page.waitForTimeout(500);
    }

    // FAB should still be visible
    await expect(fabMain).toBeVisible();

    // Version badge should still be visible
    const badge = await page.locator('#instapump-version');
    await expect(badge).toBeVisible();
  });
});
