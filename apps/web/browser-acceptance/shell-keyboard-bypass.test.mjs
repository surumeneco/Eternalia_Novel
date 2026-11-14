/** AC-63/65/78: Shell keyboard bypass + inert SSR mobile navigation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

test('SHELL-KEYBOARD-01/02/03: first Tab bypasses navigation and mobile menu waits for hydration',
  { timeout: 90_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      try {
        const ssr = await noJs.newPage();
        await ssr.goto(base + '/stories/' + fixture.seriesA);
        const menu = ssr.locator('button.nav-toggle');
        await menu.waitFor({ state: 'visible' });
        assert.equal(await menu.isDisabled(), true,
          'SSR mobile nav must remain inert until click handlers are mounted');
      } finally { await noJs.close(); }

      for (const width of [390, 1280]) {
        const context = await browser.newContext({ viewport: { width, height: 844 } });
        try {
          const page = await context.newPage();
          await page.goto(base + '/stories/' + fixture.seriesA);
          const skip = page.locator('a.skip-to-content');
          await skip.waitFor();
          assert.equal(await skip.getAttribute('href'), '#main-content');
          assert.equal(await skip.innerText(), '本文へ移動');
          assert.equal(await page.locator('main#main-content[tabindex="-1"]').count(), 1);
          await page.keyboard.press('Tab');
          assert.equal(await skip.evaluate(el => el === document.activeElement), true,
            'the first keyboard focus target must bypass the header and aside');
          const rect = await skip.boundingBox();
          assert.ok(rect && rect.y >= 0 && rect.y < 844 && rect.x >= 0 && rect.x < width,
            'focused skip link must be visible inside the viewport');
          await page.keyboard.press('Enter');
          assert.equal(await page.evaluate(() => document.activeElement?.id), 'main-content',
            'Enter must move actual keyboard focus to the main landmark');

          await page.locator('button.locale-switch:not(:disabled)').waitFor();
          await page.locator('button.locale-switch').click();
          await page.locator('html[lang="en"]').waitFor();
          assert.equal(await skip.innerText(), 'Skip to content');
          assert.equal(await skip.getAttribute('href'), '#main-content');
          const body = await page.locator('main').innerText();
          assert.ok(body.includes(fixture.prefix + '-world-A'),
            'switching fixed UI labels must not translate author-created content');
          if (width === 390) {
            const menu = page.locator('button.nav-toggle:not(:disabled)');
            await menu.waitFor();
            assert.equal(await menu.getAttribute('aria-expanded'), 'false');
            await menu.click();
            assert.equal(await menu.getAttribute('aria-expanded'), 'true');
            assert.equal(await page.locator('nav#global-navigation').evaluate(el => el.classList.contains('is-open')), true);
            await menu.click();
            assert.equal(await menu.getAttribute('aria-expanded'), 'false');
          }
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  });
