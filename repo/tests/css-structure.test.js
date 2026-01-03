/**
 * CSS Structure Tests
 * Ensures CSS modules are properly separated and won't break each other
 */

const fs = require('fs');
const path = require('path');

const userscriptPath = path.join(__dirname, '../userscript/instapump.user.js');
const userscript = fs.readFileSync(userscriptPath, 'utf8');

describe('CSS Structure', () => {

  test('BASE_CSS exists and contains video styling', () => {
    expect(userscript).toMatch(/const BASE_CSS = `/);
    expect(userscript).toMatch(/BASE_CSS[\s\S]*?video\s*\{/);
  });

  test('HIDE_CSS exists and is separate from UI_CSS', () => {
    expect(userscript).toMatch(/const HIDE_CSS = `/);
    expect(userscript).toMatch(/const UI_CSS = `/);
  });

  test('UI_CSS contains InstaPump UI elements', () => {
    // Extract UI_CSS content
    const uiCssMatch = userscript.match(/const UI_CSS = `([\s\S]*?)`;/);
    expect(uiCssMatch).toBeTruthy();

    const uiCss = uiCssMatch[1];
    expect(uiCss).toContain('#instapump-fab');
    expect(uiCss).toContain('#instapump-status');
    expect(uiCss).toContain('#instapump-toast');
  });

  test('HIDE_CSS does NOT contain InstaPump UI elements', () => {
    // Extract HIDE_CSS content
    const hideCssMatch = userscript.match(/const HIDE_CSS = `([\s\S]*?)`;/);
    expect(hideCssMatch).toBeTruthy();

    const hideCss = hideCssMatch[1];
    expect(hideCss).not.toContain('#instapump-fab');
    expect(hideCss).not.toContain('#instapump-status');
    expect(hideCss).not.toContain('#instapump-toast');
  });

  test('HIDE_CSS contains only hiding-related styles', () => {
    const hideCssMatch = userscript.match(/const HIDE_CSS = `([\s\S]*?)`;/);
    const hideCss = hideCssMatch[1];

    // Should contain hiding rules
    expect(hideCss).toMatch(/display:\s*none/);
    expect(hideCss).toMatch(/background/);
  });

  test('Three separate stylesheets are injected', () => {
    expect(userscript).toContain("id = 'instapump-base-css'");
    expect(userscript).toContain("id = 'instapump-ui-css'");
    expect(userscript).toContain("id = 'instapump-hide-css'");
  });

  test('Only HIDE_CSS is toggleable', () => {
    // HIDE_CSS should have disabled property set
    expect(userscript).toMatch(/instapump-hide-css[\s\S]*?\.disabled\s*=/);

    // BASE_CSS and UI_CSS should NOT have disabled property
    const baseInject = userscript.match(/instapump-base-css[\s\S]{0,200}/);
    const uiInject = userscript.match(/instapump-ui-css[\s\S]{0,200}/);

    expect(baseInject[0]).not.toContain('.disabled');
    expect(uiInject[0]).not.toContain('.disabled');
  });
});

describe('Version Consistency', () => {

  test('Header version matches VERSION constant', () => {
    const headerVersion = userscript.match(/@version\s+(\d+\.\d+\.\d+)/);
    const constVersion = userscript.match(/const VERSION = '(\d+\.\d+\.\d+)'/);

    expect(headerVersion).toBeTruthy();
    expect(constVersion).toBeTruthy();
    expect(headerVersion[1]).toBe(constVersion[1]);
  });
});
