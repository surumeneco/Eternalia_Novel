import { selectUiLanguage } from './ui-language.mjs';
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

const readerDetails = [
  { path: () => '/series/' + fixture.seriesA, title: () => fixture.prefix + '-world-A', kind: 'series' },
  { path: () => '/items/' + fixture.tip, title: () => fixture.prefix + '-visible-setting', kind: 'tip' },
  { path: () => '/read/' + fixture.chapter, title: () => fixture.prefix + '-chapter-A', kind: 'chapter' },
];

test('UI6-DETAIL-DOM-01/02: anonymous series, Tip, and chapter readers keep shell-to-content DOM composition across widths',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      for (const entry of readerDetails) {
        const response = await page.goto(base + entry.path());
        assert.equal(response?.status(), 200, entry.path());
        await page.locator('.site-main section.stone-panel h1').filter({ hasText: entry.title() }).waitFor();
        if (entry.kind === 'chapter') await page.locator('article nav.chapter-navigation').waitFor();
        const dom = await page.evaluate(() => {
          const main = document.querySelector('main.site-main');
          const nav = main?.querySelector('nav.topic-path');
          const panel = main?.querySelector('section.stone-panel');
          return {
            header: !!document.querySelector('header.site-header'),
            aside: !!document.querySelector('aside.site-aside'),
            main: main?.tagName === 'MAIN',
            footer: !!document.querySelector('footer.site-footer'),
            labelledNav: !!nav?.getAttribute('aria-label'),
            currentCrumb: !!nav?.querySelector('[aria-current="page"]'),
            navBeforePanel: nav?.parentElement === panel?.parentElement &&
              nav?.nextElementSibling === panel,
            panelCount: main?.querySelectorAll('section.stone-panel').length,
            headings: [...(panel?.querySelectorAll('h1') ?? [])].map(h => h.textContent?.trim()),
            authorEditLinks: main?.querySelectorAll('a[href*="/studio"]').length,
            chapterArticle: !!panel?.querySelector('article > .rich-content'),
            chapterNav: !!panel?.querySelector('article nav.chapter-navigation'),
          };
        });
        assert.ok(dom.header && dom.aside && dom.main && dom.footer,
          entry.kind + ' shell landmarks: ' + JSON.stringify(dom));
        assert.ok(dom.labelledNav && dom.currentCrumb && dom.navBeforePanel,
          entry.kind + ' breadcrumb and stone panel composition: ' + JSON.stringify(dom));
        assert.equal(dom.panelCount, 1, entry.kind + ' uses one reader panel');
        assert.deepEqual(dom.headings, [entry.title()], entry.kind + ' published H1');
        assert.equal(dom.authorEditLinks, 0, 'anonymous readers cannot see author edit links');
        if (entry.kind === 'chapter') {
          assert.equal(dom.chapterArticle, true, 'chapter RichContent stays inside its article');
          assert.equal(dom.chapterNav, true, 'chapter navigation stays inside its article');
        }
        for (const width of [320, 390, 768, 1280]) {
          await page.setViewportSize({ width, height: 844 });
          const dimensions = await page.evaluate(() => ({
            client: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
          }));
          assert.ok(dimensions.scroll <= dimensions.client + 2,
            entry.kind + ' at ' + width + 'px overflow: ' + JSON.stringify(dimensions));
          assert.equal(await page.locator('.site-main section.stone-panel h1').innerText(), entry.title());
        }
      }
      await context.close();
    } finally { await browser.close(); }
  });

test('UI6-DETAIL-DOM-03: no-JavaScript SSR retains public series, Tip, and both chapter pages without draft content',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      for (const entry of readerDetails) {
        const response = await page.goto(base + entry.path());
        assert.equal(response?.status(), 200, entry.path());
        assert.equal(await page.locator('.site-main section.stone-panel h1').innerText(), entry.title());
        assert.equal(await page.locator('.site-main nav.topic-path[aria-label]').count(), 1);
        assert.equal(await page.locator('.site-main a[href*="/studio"]').count(), 0);
        const readerText = await page.locator('.site-main').innerText();
        assert.ok(!readerText.includes(fixture.prefix + '-unpublished-draft-title'));
        assert.ok(!readerText.includes(fixture.prefix + '-unpublished-draft-body'));
        if (entry.kind === 'chapter') {
          assert.equal(await page.locator('article .rich-content .rich-page').count(), 2,
            'server HTML exposes both published chapter pages with scripts disabled');
          assert.ok(readerText.includes(fixture.prefix + '-published-body'));
        }
      }
      await context.close();
    } finally { await browser.close(); }
  });

test('UI6-SLOT-DOM-01: anonymous SSR projects home and collection default-slot content directly into stone panels',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();

      const home = await page.goto(base + '/');
      assert.equal(home?.status(), 200);
      const homeDom = await page.evaluate(() => {
        const main = document.querySelector('main.site-main');
        const container = main?.firstElementChild;
        const panels = [...(container?.children ?? [])].filter(el =>
          el.matches('section.stone-panel'));
        return {
          mainHasRoute: main?.contains(container),
          panelCount: panels.length,
          directHeadingTags: panels.map(panel =>
            [...panel.children].filter(el => el.matches('h1,h2')).map(el => el.tagName)),
          headings: panels.map(panel =>
            [...panel.children].filter(el => el.matches('h1,h2')).map(el => el.textContent?.trim())),
          hasPublishedSeriesLink: Boolean(panels[1]?.querySelector(
            'ul.reader-list a[href*="/series/"]')),
          authorLinks: main?.querySelectorAll('a[href*="/studio"]').length,
        };
      });
      assert.equal(homeDom.mainHasRoute, true, 'layout default slot projects route inside main');
      assert.equal(homeDom.panelCount, 3, 'home renders three reader panels via default slots');
      // The home introduction no longer labels the four series-owned
      // content domains as an independent global section.
      assert.deepEqual(homeDom.directHeadingTags, [['H1'], ['H2'], ['H2']]);
      assert.equal(homeDom.headings[0][0], 'Eternalia');
      assert.equal(homeDom.hasPublishedSeriesLink, true,
        'published series list is inside the second reader panel');
      assert.equal(homeDom.authorLinks, 0, 'SSR never exposes author actions');

      const collection = await page.goto(base + '/stories');
      assert.equal(collection?.status(), 200);
      const collectionDom = await page.evaluate(() => {
        const main = document.querySelector('main.site-main');
        const nav = main?.querySelector('nav.topic-path');
        const panel = main?.querySelector('section.stone-panel');
        return {
          mainHasRoute: Boolean(main?.contains(nav) && main?.contains(panel)),
          breadcrumbBeforePanel: nav?.nextElementSibling === panel,
          headingDirect: panel?.querySelector(':scope > h1')?.textContent?.trim(),
          listDirect: Boolean(panel?.querySelector(':scope > ul.reader-list')),
          authorLinks: panel?.querySelectorAll('a[href*="/studio"]').length,
        };
      });
      assert.equal(collectionDom.mainHasRoute, true);
      assert.equal(collectionDom.breadcrumbBeforePanel, true);
      assert.equal(collectionDom.headingDirect, 'ストーリー');
      assert.equal(collectionDom.listDirect, true, 'collection list is a direct slot child');
      assert.equal(collectionDom.authorLinks, 0);
      assert.ok((await page.locator('main.site-main section.stone-panel ul.reader-list').innerText())
        .includes(fixture.prefix + '-world-A'));
      await context.close();
    } finally { await browser.close(); }
  });

test('UI6-SLOT-DOM-02: authenticated memo and Tip editor preserve direct slot projections through hydration',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addCookies([{
        name: 'eternalia_author', value: fixture.authorToken,
        url: base, httpOnly: true, sameSite: 'Lax',
      }]);
      const page = await context.newPage();
      const memoResponse = await page.goto(base + '/studio/memos');
      assert.equal(memoResponse?.status(), 200);
      await page.locator('main.site-main .memo-grid').waitFor();
      const memoStructure = await page.evaluate(() => {
        const main = document.querySelector('main.site-main');
        const nav = main?.querySelector('nav.topic-path');
        const panel = main?.querySelector('section.stone-panel');
        const grid = panel?.querySelector(':scope > .memo-grid');
        return {
          breadcrumbBeforePanel: nav?.nextElementSibling === panel,
          directHeading: panel?.querySelector(':scope > h1')?.textContent?.trim(),
          gridDirect: Boolean(grid),
          sidebarDirect: Boolean(grid?.querySelector(':scope > aside.memo-sidebar')),
          editorDirect: Boolean(grid?.querySelector(':scope > section.memo-editor')),
        };
      });
      assert.deepEqual(memoStructure, {
        breadcrumbBeforePanel: true, directHeading: 'メモ',
        gridDirect: true, sidebarDirect: true, editorDirect: true,
      });
      await selectUiLanguage(page, 'en');
      await page.locator('main.site-main section.stone-panel > h1').filter({ hasText: 'Notes' }).waitFor();
      assert.equal(await page.locator('main.site-main section.stone-panel > .memo-grid').count(), 1);

      const tipResponse = await page.goto(base + '/studio?item=' + fixture.tip);
      assert.equal(tipResponse?.status(), 200);
      await page.locator('.studio-editor .author-reference').waitFor();
      const editorStructure = await page.evaluate(() => {
        const main = document.querySelector('main.site-main');
        const nav = main?.querySelector('nav.topic-path');
        const panel = main?.querySelector('section.stone-panel');
        const title = panel?.querySelector(':scope > .studio-title');
        const grid = panel?.querySelector(':scope > .studio-grid');
        return {
          breadcrumbBeforePanel: nav?.nextElementSibling === panel,
          titleDirect: Boolean(title?.querySelector('h1')),
          gridDirect: Boolean(grid),
          referenceWithinGrid: Boolean(grid?.querySelector('section.author-reference')),
        };
      });
      assert.deepEqual(editorStructure, {
        breadcrumbBeforePanel: true, titleDirect: true,
        gridDirect: true, referenceWithinGrid: true,
      });
      await context.close();
    } finally { await browser.close(); }
  });
