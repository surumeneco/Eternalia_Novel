/**
 * Exploratory browser acceptance: Chromium mobile/touch emulation, not a
 * physical Android device or real operating-system Japanese IME conversion.
 * Uses the same explicitly disposable PostgreSQL fixture as the alpha suite.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback app required');

async function authorContext(browser, width = 390) {
  const context = await browser.newContext({
    viewport: { width, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  await context.addCookies([{
    name: 'eternalia_author', value: fixture.authorToken, url: base,
    httpOnly: true, sameSite: 'Lax',
  }]);
  return context;
}

async function createDraftChapter(context) {
  const response = await context.request.post(base + '/api/admin/nodes', {
    headers: { Origin: base },
    data: {
      kind: 'chapter', parentId: fixture.part,
      content: {
        title: fixture.prefix + '-mobile-touch-chapter',
        body: '前漢字後', details: {},
      },
    },
  });
  assert.equal(response.status(), 201, await response.text());
  return (await response.json()).id;
}

test('touch toolbar preserves selected Japanese text and separates draft from publication',
  { timeout: 90_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const author = await authorContext(browser);
      try {
        const chapter = await createDraftChapter(author);
        const page = await author.newPage();
        await page.goto(base + '/studio?item=' + chapter);
        const editor = page.getByRole('textbox', { name: '本文・説明', exact: true });
        const ruby = page.getByRole('button', { name: '選択文字にルビを付ける' });
        const marker = page.getByRole('button', { name: 'このページの後に追加' });
        await editor.waitFor();
        assert.equal(await editor.inputValue(), '前漢字後');

        await editor.evaluate(el => { el.focus(); el.setSelectionRange(1, 3); });
        await ruby.tap();
        assert.equal(await editor.inputValue(), '前｜漢字《よみ》後',
          'touch insertion must wrap the selected base text, not a collapsed cursor');
        assert.equal(await editor.evaluate(el => document.activeElement === el), true,
          'touch toolbar must restore focus to the manuscript');
        assert.equal(await editor.evaluate(el => el.value.slice(el.selectionStart, el.selectionEnd)), 'よみ',
          'touch toolbar must focus the reading placeholder for immediate input');
        await editor.pressSequentially('かんじ');
        assert.equal(await editor.inputValue(), '前｜漢字《かんじ》後');

        // A simulated composition pair is a DOM race probe, not native IME evidence.
        await editor.dispatchEvent('compositionstart');
        assert.equal(await ruby.isDisabled(), true, 'do not insert during composition');
        assert.equal(await marker.isDisabled(), true, 'do not insert markers during composition');
        await editor.dispatchEvent('compositionend');
        assert.equal(await marker.isEnabled(), true);
        const firstPage = await editor.inputValue();
        await marker.tap();
        assert.equal(await editor.inputValue(), '', 'new page begins empty');
        await editor.fill('二頁');
        await page.getByRole('button', { name: '前のページ' }).tap();
        assert.equal(await editor.inputValue(), firstPage,
          'touch page navigation must preserve the ruby page');
        await page.getByRole('button', { name: '次のページ' }).tap();
        assert.equal(await editor.inputValue(), '二頁');

        await page.getByRole('button', { name: '下書きを保存' }).tap();
        await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
        let publicResponse = await author.request.get(base + '/api/public/items/' + chapter);
        assert.equal(publicResponse.status(), 404, 'a saved mobile draft is not public');
        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: '保存済み下書きを公開版へ反映' }).tap();
        await page.getByText('公開スナップショットを更新しました。').waitFor();
        publicResponse = await author.request.get(base + '/api/public/items/' + chapter);
        assert.equal(publicResponse.status(), 200, 'published chapter must be visible to readers');
        assert.deepEqual((await publicResponse.json()).content.pages, [firstPage, '二頁']);
        await page.reload();
        assert.equal(await editor.inputValue(), firstPage, 'first page survives reload');
        await page.getByRole('button', { name: '次のページ' }).tap();
        assert.equal(await editor.inputValue(), '二頁', 'second page survives reload');
      } finally { await author.close(); }
    } finally { await browser.close(); }
  });

test('story, setting, dictionary and timeline author editors fit 320px and 390px touch viewports',
  { timeout: 90_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const author = await authorContext(browser, 320);
      try {
        const page = await author.newPage();
        for (const width of [320, 390]) {
          await page.setViewportSize({ width, height: 780 });
          for (const [kind, id] of [
            ['chapter', fixture.chapter], ['tipSection', fixture.section],
            ['word', fixture.word], ['event', fixture.event],
          ]) {
            await page.goto(base + '/studio?item=' + id);
            const editor = page.getByRole('textbox', { name: '本文・説明', exact: true });
            await editor.waitFor();
            const dimensions = await page.evaluate(() => ({
              viewport: document.documentElement.clientWidth,
              content: document.documentElement.scrollWidth,
            }));
            assert.ok(dimensions.content <= dimensions.viewport + 2,
              kind + ' overflow at ' + width + 'px: ' + JSON.stringify(dimensions));
            assert.equal(await editor.isVisible(), true, kind + ' editing field hidden at ' + width);
            const save = page.getByRole('button', { name: '下書きを保存' });
            assert.equal(await save.isVisible(), true, kind + ' save action hidden at ' + width);
            assert.equal(await save.isEnabled(), true, kind + ' save action disabled at ' + width);
          }
        }
      } finally { await author.close(); }
    } finally { await browser.close(); }
  });

test('reader shell preserves runtime colors and mobile navigation for keyboard and touch',
  { timeout: 60_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const reader = await browser.newContext({
        viewport: { width: 320, height: 780 }, isMobile: true, hasTouch: true,
      });
      try {
        const page = await reader.newPage();
        const response = await page.goto(base + '/stories/' + fixture.seriesA);
        assert.equal(response?.status(), 200);
        const styles = await page.evaluate(() => {
          const header = document.querySelector('.site-header');
          const panel = document.querySelector('.stone-panel');
          if (!header || !panel) throw new Error('reader shell is incomplete');
          return {
            header: getComputedStyle(header).backgroundColor,
            panel: getComputedStyle(panel).backgroundColor,
            background: getComputedStyle(document.body).backgroundImage,
            width: document.documentElement.scrollWidth,
            viewport: document.documentElement.clientWidth,
          };
        });
        assert.equal(styles.header, 'rgb(0, 191, 255)', 'retained sky-blue header role');
        assert.equal(styles.panel, 'rgb(38, 38, 38)', 'retained dark stone-panel role');
        assert.match(styles.background, /linear-gradient/i, 'sky-to-grass background required');
        assert.ok(styles.background.includes('rgb(63, 111, 127)') &&
          styles.background.includes('rgb(0, 63, 21)'),
          'retain the approved gradient endpoints');
        assert.ok(styles.width <= styles.viewport + 2, 'reader shell must fit the phone viewport');

        const menu = page.locator('.nav-toggle');
        const nav = page.locator('#global-navigation');
        assert.equal(await menu.isVisible(), true);
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        assert.equal(await nav.isVisible(), false);
        await menu.focus();
        await menu.press('Enter');
        assert.equal(await menu.getAttribute('aria-expanded'), 'true',
          'keyboard activation should expand the mobile nav');
        assert.equal(await nav.isVisible(), true);
        await menu.press('Enter');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false',
          'keyboard activation should collapse the mobile nav');

        await menu.tap();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await nav.locator('a[href="/dictionaries"]').tap();
        await page.waitForURL(base + '/dictionaries');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false',
          'touch navigation should close after a route transition');
      } finally { await reader.close(); }
    } finally { await browser.close(); }
  });

test('Chromium touch editor enforces GB4/GB5 fallback without Intl.Segmenter',
  { timeout: 90_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const author = await authorContext(browser);
      try {
        const chapter = await createDraftChapter(author);
        const page = await author.newPage();
        await page.addInitScript(() => {
          Object.defineProperty(Intl, 'Segmenter', { configurable: true, value: undefined });
        });
        await page.goto(base + '/studio?item=' + chapter);
        assert.equal(await page.evaluate(() => typeof Intl.Segmenter), 'undefined');
        const editor = page.getByRole('textbox', { name: '本文・説明', exact: true });
        const marker = page.getByRole('button', { name: '選択文字にルビを付ける' });
        await editor.waitFor();

        await editor.fill('前か\u3099後');
        await editor.evaluate(el => { el.focus(); el.setSelectionRange(2, 2); });
        await marker.tap();
        assert.equal(await editor.inputValue(), '前か\u3099後',
          'ruby fallback must still reject insertion inside a kana combining cluster');

        await editor.fill('前\n\u3099後');
        await editor.evaluate(el => { el.focus(); el.setSelectionRange(2, 2); });
        await marker.tap();
        assert.equal(await editor.inputValue(), '前\n｜文字《よみ》\u3099後',
          'ruby fallback must allow an insertion at the LF/combining-mark boundary');
      } finally { await author.close(); }
    } finally { await browser.close(); }
  });

test('Chromium touch editor respects Unicode fallback boundaries across scripts',
  { timeout: 90_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const author = await authorContext(browser);
      try {
        const chapter = await createDraftChapter(author);
        const page = await author.newPage();
        await page.addInitScript(() => {
          Object.defineProperty(Intl, 'Segmenter', { configurable: true, value: undefined });
        });
        await page.goto(base + '/studio?item=' + chapter);
        assert.equal(await page.evaluate(() => typeof Intl.Segmenter), 'undefined');
        const editor = page.getByRole('textbox', { name: '本文・説明', exact: true });
        const marker = page.getByRole('button', { name: '選択文字にルビを付ける' });
        await editor.waitFor();

        const cases = [
          { name: 'ZWNJ inside', source: '前a\u200Cb後', offset: 2, permitted: false },
          { name: 'ZWNJ after', source: '前a\u200Cb後', offset: 3, permitted: true },
          { name: 'Prepend inside', source: '前\u0600\u0627後', offset: 2, permitted: false },
          { name: 'Prepend after', source: '前\u0600\u0627後', offset: 3, permitted: true },
          { name: 'Indic inside', source: '前क्ष後', offset: 3, permitted: false },
          { name: 'Indic after', source: '前क्ष後', offset: 4, permitted: true },
          { name: 'non-emoji ZWJ after', source: '前a\u200Db後', offset: 3, permitted: true },
          { name: 'emoji ZWJ inside', source: '前👩\u200D💻後', offset: 4, permitted: false },
        ];
        for (const scenario of cases) {
          await editor.fill(scenario.source);
          await editor.evaluate((el, index) => {
            el.focus();
            el.setSelectionRange(index, index);
          }, scenario.offset);
          await marker.tap();
          const expected = scenario.permitted
            ? scenario.source.slice(0, scenario.offset) + '｜文字《よみ》' +
              scenario.source.slice(scenario.offset)
            : scenario.source;
          assert.equal(await editor.inputValue(), expected, scenario.name);
        }
      } finally { await author.close(); }
    } finally { await browser.close(); }
  });
