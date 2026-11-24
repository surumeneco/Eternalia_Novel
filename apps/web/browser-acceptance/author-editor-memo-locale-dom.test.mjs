import { selectUiLanguage } from './ui-language.mjs';
/** CM-02/07/08 + UI6 trial: author memo conflict language, privacy and DOM. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback acceptance only');

async function authorContext(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addCookies([{
    name: 'eternalia_author', value: fixture.authorToken,
    url: base, httpOnly: true, sameSite: 'Lax',
  }]);
  return context;
}

test('AUTHOR-MEMO-01/02: stale author memo save localizes 409 in en and ja, preserving unsaved input',
  { timeout: 120_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await authorContext(browser);
      const title = fixture.prefix + '-memo-conflict-' + randomUUID().slice(0, 8);
      const tagResponse = await context.request.post(base + '/api/admin/masters/tags', {
        headers: { Origin: base },
        data: { group:'memo-' + randomUUID(), name:'資料', order:0 },
      });
      assert.equal(tagResponse.status(),201,await tagResponse.text());
      const tag = await tagResponse.json();
      const original = { title, body: '原稿のメモ', tags: [tag.id] };
      const createdResponse = await context.request.post(base + '/api/admin/memos', {
        headers: { Origin: base }, data: original,
      });
      assert.equal(createdResponse.status(), 201, await createdResponse.text());
      const created = await createdResponse.json();

      const page = await context.newPage();
      await page.goto(base + '/studio/memos');
      const entry = page.locator('.memo-list button').filter({ hasText: title });
      await entry.waitFor();
      await entry.click();
      const editor = page.locator('.memo-editor');
      const draftBody = editor.locator('textarea');
      assert.equal(await draftBody.inputValue(), original.body);
      const unsaved = '未保存の文章-' + randomUUID();
      await draftBody.fill(unsaved);

      const concurrentResponse = await context.request.patch(
        base + '/api/admin/memos/' + encodeURIComponent(created.id), {
          headers: { Origin: base },
          data: { ...original, body: '競合編集済みの原稿', expectedRevision: created.revision },
        },
      );
      assert.equal(concurrentResponse.status(), 200, await concurrentResponse.text());
      const concurrent = await concurrentResponse.json();
      assert.equal(concurrent.revision, created.revision + 1);

      await selectUiLanguage(page, 'en');
      await page.getByRole('heading', { name: 'Notes' }).waitFor();
      await editor.getByRole('button', { name: 'Save', exact: true }).click();
      await page.getByRole('alert').getByText(
        'Another edit has changed this item. Reload the latest revision before trying again.',
        { exact: true },
      ).waitFor();
      assert.equal(await draftBody.inputValue(), unsaved,
        'English conflict must not replace author-written unsaved body');
      assert.equal(await editor.locator('input[maxlength="150"]').inputValue(), title);

      await selectUiLanguage(page, 'ja');
      await page.getByRole('heading', { name: 'メモ', exact: true }).waitFor();
      await editor.getByRole('button', { name: '保存', exact: true }).click();
      await page.getByRole('alert').getByText('メモが他の編集により更新されました。', { exact: true }).waitFor();
      assert.equal(await draftBody.inputValue(), unsaved,
        'Japanese conflict must not replace author-written unsaved body');

      const persisted = await context.request.get(base + '/api/admin/memos');
      assert.equal(persisted.status(), 200);
      const memo = (await persisted.json()).find(item => item.id === created.id);
      assert.equal(memo.revision, concurrent.revision, 'failed writes cannot advance revision');
      assert.equal(memo.body, concurrent.body, 'failed writes cannot overwrite concurrent author');
      await context.close();
    } finally {
      await browser.close();
    }
  });

test('AUTHOR-MEMO-04: anonymous author memo and edit routes never expose drafts or management API',
  { timeout: 120_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      for (const path of ['/studio/memos', '/studio?item=' + fixture.tip]) {
        const response = await page.goto(base + path);
        assert.equal(response?.status(), 200, path);
        await page.locator('main.site-main section.stone-panel h1').waitFor();
        assert.equal(await page.locator('main.site-main nav.topic-path[aria-label]').count(), 1);
        assert.equal(await page.locator('main.site-main section.stone-panel').count(), 1);
        assert.equal(await page.locator('.memo-list, .memo-editor, .studio-grid, .author-reference').count(), 0);
        assert.ok(!(await page.locator('main').innerText()).includes(fixture.prefix + '-visible-setting'),
          path + ' must not leak author draft titles');
      }
      const response = await context.request.get(base + '/api/admin/memos');
      assert.equal(response.status(), 401, 'memo collection must reject anonymous requests');
      await context.close();
    } finally {
      await browser.close();
    }
  });

test('AUTHOR-MEMO-03: note and chapter/Tip author screens compose shell, panel and reference without overflow',
  { timeout: 120_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await authorContext(browser);
      const page = await context.newPage();
      for (const [path, selector, hasReference] of [
        ['/studio/memos', '.memo-grid', false],
        ['/studio?item=' + fixture.tip, '.studio-editor .author-reference', true],
        ['/studio?item=' + fixture.chapter, '.studio-editor .author-reference', true],
      ]) {
        const response = await page.goto(base + path);
        assert.equal(response?.status(), 200, path);
        await page.locator(selector).first().waitFor();
        const dom = await page.evaluate(() => {
          const main = document.querySelector('main.site-main');
          const nav = main?.querySelector('nav.topic-path');
          const panel = main?.querySelector('section.stone-panel');
          return {
            shell: Boolean(document.querySelector('header.site-header') &&
              document.querySelector('aside.site-aside') &&
              document.querySelector('footer.site-footer') && main),
            breadcrumb: Boolean(nav?.getAttribute('aria-label')) &&
              nav?.nextElementSibling === panel,
            panels: main?.querySelectorAll('section.stone-panel').length,
            headings: panel?.querySelectorAll('h1').length,
            referenceCount: panel?.querySelectorAll('section.author-reference').length,
          };
        });
        assert.equal(dom.shell, true, path + ' shell');
        assert.equal(dom.breadcrumb, true, path + ' breadcrumb before stone panel');
        assert.equal(dom.panels, 1, path + ' one content panel');
        assert.equal(dom.headings, 1, path + ' one h1');
        assert.equal(dom.referenceCount, hasReference ? 1 : 0, path + ' reference panel');
        for (const width of [320, 390, 768, 1280]) {
          await page.setViewportSize({ width, height: 844 });
          const size = await page.evaluate(() => ({
            client: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
          }));
          assert.ok(size.scroll <= size.client + 2,
            path + ' at ' + width + 'px overflows: ' + JSON.stringify(size));
        }
      }
      await context.close();
    } finally {
      await browser.close();
    }
  });
