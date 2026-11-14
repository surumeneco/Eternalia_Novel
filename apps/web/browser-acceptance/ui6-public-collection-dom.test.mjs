/** Source-derived UI6-DOM-OBS: actual DOM and no-JS SSR, not a normative CAT Gate. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
const areas = [
  ['stories', 'ストーリー'],
  ['tips', '設定集'],
  ['dictionaries', '辞書'],
  ['timeline', '年表'],
];

test('UI6-DOM-OBS-01/03/04: four anonymous public collections preserve semantic composition and mobile width',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable HTTP fixture required');
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      for (const [area, label] of areas) {
        const response = await page.goto(base + '/' + area);
        assert.equal(response?.status(), 200, area);
        await page.locator('.site-main .reader-list').getByRole('link', {
          name: fixture.prefix + '-world-A', exact: true,
        }).waitFor();
        const dom = await page.evaluate(() => {
          const main = document.querySelector('.site-main');
          const nav = main?.querySelector('nav.topic-path');
          const panel = main?.querySelector('section.stone-panel');
          return {
            header: !!document.querySelector('header.site-header'),
            aside: !!document.querySelector('aside.site-aside'),
            main: main?.tagName === 'MAIN',
            footer: !!document.querySelector('footer.site-footer'),
            nav: !!nav && !!nav.getAttribute('aria-label'),
            navBeforePanel: nav?.parentElement === panel?.parentElement &&
              nav?.nextElementSibling === panel,
            heading: panel?.querySelector('h1')?.textContent?.trim(),
            readerListCount: panel?.querySelectorAll('ul.reader-list').length,
            authorCreateLinkCount: panel?.querySelectorAll('a[href*="/studio"]').length,
          };
        });
        assert.ok(dom.header && dom.aside && dom.main && dom.footer,
          area + ' must keep the v0.3 legacy reader shell: ' + JSON.stringify(dom));
        assert.equal(dom.nav, true, area + ' breadcrumb must have a semantic label');
        assert.equal(dom.navBeforePanel, true, area + ' breadcrumb must precede the content panel');
        assert.equal(dom.heading, label, area + ' heading is inside the stone content panel');
        assert.equal(dom.readerListCount, 1, area + ' has one series collection');
        assert.equal(dom.authorCreateLinkCount, 0, 'anonymous users must not see writer controls');

        for (const width of [320, 390, 768, 1280]) {
          await page.setViewportSize({ width, height: 844 });
          const dimensions = await page.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
          }));
          assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 2,
            area + ' ' + width + 'px horizontal overflow: ' + JSON.stringify(dimensions));
          assert.equal(await page.locator('.site-main section.stone-panel h1').innerText(), label);
        }
      }
      await context.close();
    } finally { await browser.close(); }
  });

test('UI6-DOM-OBS-02: all four published collections are readable in server HTML without JavaScript',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      for (const [area, label] of areas) {
        const response = await page.goto(base + '/' + area);
        assert.equal(response?.status(), 200, area);
        assert.equal(await page.locator('.site-main section.stone-panel h1').innerText(), label);
        assert.ok((await page.locator('.site-main ul.reader-list').innerText())
          .includes(fixture.prefix + '-world-A'),
          area + ' must render published series in initial HTML');
        assert.equal(await page.locator('.site-main a[href*="/studio"]').count(), 0);
      }
      await context.close();
    } finally { await browser.close(); }
  });
