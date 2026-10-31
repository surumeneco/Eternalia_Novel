/**
 * Browser acceptance against the real built Nuxt/Nest/PostgreSQL application.
 * A synthetic author session is seeded only in an empty disposable CI database.
 * This is not an end-to-end test of Discord's OAuth2 identity provider.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

test('anonymous mobile reading and browser-based author draft/publish workflow', { timeout: 120_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback acceptance URL required');
  const browser = await chromium.launch({ headless: true });
  try {
    const reader = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const readerPage = await reader.newPage();
    await readerPage.goto(base + '/stories/' + fixture.seriesA);
    await readerPage.getByRole('heading', { name: fixture.prefix + '-world-A' }).waitFor();
    assert.ok((await readerPage.locator('body').innerText()).includes(fixture.prefix + '-chapter-A'));
    const overflow = await readerPage.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(overflow.content <= overflow.viewport + 2,
      'story page must not require horizontal scrolling on mobile: ' + JSON.stringify(overflow));

    await readerPage.goto(base + '/read/' + fixture.chapter);
    await readerPage.getByRole('button', { name: '次のページ' }).waitFor();
    assert.ok((await readerPage.locator('.rich-body').innerText())
      .includes(fixture.prefix + '-published-body'));
    await readerPage.getByRole('button', { name: '次のページ' }).click();
    assert.equal((await readerPage.locator('.reading-pages span').innerText()).trim(), '2 / 2');
    assert.ok(!(await readerPage.locator('body').innerText())
      .includes(fixture.prefix + '-unpublished-draft-body'));

    const author = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const studio = await author.newPage();
    await studio.goto(base + '/studio');
    await studio.getByRole('button', { name: '新規シリーズ' }).waitFor();
    await studio.getByRole('button', { name: '新規シリーズ' }).click();
    const title = fixture.prefix + '-browser-created';
    await studio.locator('.create-form input').fill(title);
    await studio.getByRole('button', { name: '作成', exact: true }).click();
    await studio.getByRole('heading', { name: 'シリーズ：' + title }).waitFor();

    const textarea = studio.locator('.studio-editor textarea');
    await textarea.fill('ブラウザから保存した公開用の説明');
    await studio.getByRole('button', { name: '下書きを保存' }).click();
    await studio.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();

    const nodesResponse = await author.request.get(base + '/api/admin/nodes');
    assert.equal(nodesResponse.status(), 200);
    const nodes = await nodesResponse.json();
    const created = nodes.find(node => node.kind === 'series' && node.draft.title === title);
    assert.ok(created?.id, 'browser-created series should persist in PostgreSQL');
    assert.equal((await reader.request.get(base + '/api/public/items/' + created.id)).status(), 404,
      'draft must not become public without explicit publication');

    studio.once('dialog', dialog => dialog.accept());
    await studio.getByRole('button', { name: '保存済み下書きを公開版へ反映' }).click();
    await studio.getByText('公開スナップショットを更新しました。').waitFor();
    await readerPage.goto(base + '/series/' + created.id);
    await readerPage.getByRole('heading', { name: title }).waitFor();
    assert.ok((await readerPage.locator('body').innerText()).includes('ブラウザから保存した公開用の説明'));

    // Cancelling the native discard warning must preserve unsaved text.
    await textarea.fill('下書き未保存の編集内容');
    studio.once('dialog', dialog => dialog.dismiss());
    await studio.getByRole('button', { name: '新規シリーズ' }).click();
    assert.equal(await textarea.inputValue(), '下書き未保存の編集内容');
    await author.close();
    await reader.close();
  } finally {
    await browser.close();
  }
});
