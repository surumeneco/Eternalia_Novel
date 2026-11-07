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
        const marker = page.getByRole('button', { name: 'ページ区切りを挿入' });
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
        await editor.evaluate(el => { el.focus(); el.setSelectionRange(1, 4); });
        await marker.tap();
        const body = await editor.inputValue();
        assert.equal(body, '前[[page]]｜漢字《かんじ》後',
          'touch marker insertion must not delete the selected text');

        await page.getByRole('button', { name: '下書きを保存' }).tap();
        await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
        let publicResponse = await author.request.get(base + '/api/public/items/' + chapter);
        assert.equal(publicResponse.status(), 404, 'a saved mobile draft is not public');
        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: '保存済み下書きを公開版へ反映' }).tap();
        await page.getByText('公開スナップショットを更新しました。').waitFor();
        publicResponse = await author.request.get(base + '/api/public/items/' + chapter);
        assert.equal(publicResponse.status(), 200, 'published chapter must be visible to readers');
        assert.equal((await publicResponse.json()).content.body, body);
        await page.reload();
        assert.equal(await editor.inputValue(), body, 'mobile touch edit must persist after reload');
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
