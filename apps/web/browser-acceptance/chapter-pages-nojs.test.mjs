/** WR-02/PB-13: published chapter pages must all be readable in SSR without JS. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

test('CHAPTER-NOJS-01/02/03: no-JS SSR shows every chapter page; hydration upgrades to pager',
  { timeout: 90_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      const url = base + '/read/' + fixture.chapter;
      const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      try {
        const page = await noJs.newPage();
        const response = await page.goto(url);
        assert.equal(response?.status(), 200);
        const sections = page.locator('.rich-content .rich-page');
        assert.equal(await sections.count(), 2,
          'SSR must render every published chapter page, even with JavaScript disabled');
        assert.ok((await sections.first().innerText()).includes(fixture.prefix + '-published-body'));
        assert.equal(await page.locator('.rich-page > .note').count(), 2,
          'fallback reader must identify the order of the pages');
        assert.equal(await page.locator('.reading-pages button').count(), 0,
          'JavaScript-free SSR must not offer dead page navigation controls');
        assert.ok(!(await page.locator('main').innerText()).includes(fixture.prefix + '-unpublished-draft-body'));
      } finally { await noJs.close(); }

      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        const page = await context.newPage();
        await page.goto(url);
        await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
        const next = page.getByRole('button', { name: '次のページ' });
        await next.waitFor();
        await page.waitForFunction(() => {
          const next = document.querySelector('.reading-pages button:last-of-type');
          return next && !next.disabled;
        });
        assert.equal(await page.locator('.rich-page').count(), 1,
          'hydrated reader must initially show a single page');
        assert.equal((await page.locator('.reading-pages span').innerText()).trim(), '1 / 2');
        await next.click();
        assert.equal((await page.locator('.reading-pages span').innerText()).trim(), '2 / 2');
        assert.equal(await page.locator('.rich-page').count(), 1);
        await page.locator('button.locale-switch:not(:disabled)').click();
        await page.locator('html[lang="en"]').waitFor();
        assert.equal((await page.locator('.reading-pages span').innerText()).trim(), '2 / 2');
        assert.equal(await page.getByRole('button', { name: 'Previous page' }).count(), 1);
        assert.ok((await page.locator('main').innerText()).includes(fixture.prefix + '-chapter-A'),
          'locale switch must never translate authored chapter title');
        assert.ok(!(await page.locator('main').innerText()).includes(fixture.prefix + '-unpublished-draft-body'));
      } finally { await context.close(); }
    } finally { await browser.close(); }
  });
