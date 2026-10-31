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
    const storyResponse = await readerPage.goto(base + '/stories/' + fixture.seriesA);
    const storyText = await readerPage.locator('body').innerText();
    assert.equal(storyResponse?.status(), 200, 'story HTTP response: ' + storyText.slice(0, 1500));
    assert.ok(storyText.includes(fixture.prefix + '-world-A') &&
      storyText.includes(fixture.prefix + '-chapter-A'),
      'story DOM should display published series and chapter; got: ' + storyText.slice(0, 2000));
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

    // These routes must show their actual per-series views, not collection parents.
    for (const [path, marker] of [
      ['/tips/', '設定を検索'],
      ['/dictionaries/', '単語を検索'],
      ['/timeline/', '年代区分'],
    ]) {
      await readerPage.goto(base + path + fixture.seriesA);
      const content = await readerPage.locator('body').innerText();
      assert.ok(content.includes(marker), 'missing nested domain UI at ' + path);
      assert.ok(content.includes(fixture.prefix + '-world-A'), 'missing series at ' + path);
    }

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

    // Publishing and visibility changes must not overwrite the unsaved editor
    // buffer or accidentally publish it. Verify the direct anonymous endpoint.
    const unsavedBeforePublication = '公開操作をしても残す未保存の文章';
    await textarea.fill(unsavedBeforePublication);
    studio.once('dialog', dialog => dialog.accept());
    await studio.getByRole('button', { name: '保存済み下書きを公開版へ反映' }).click();
    await studio.getByText('公開スナップショットを更新しました。').waitFor();
    assert.equal(await textarea.inputValue(), unsavedBeforePublication,
      'publication must preserve the unsaved author buffer');
    const unchangedPublic = await reader.request.get(base + '/api/public/items/' + created.id);
    assert.equal(unchangedPublic.status(), 200);
    assert.equal((await unchangedPublic.json()).content.body, 'ブラウザから保存した公開用の説明',
      'unsaved author text must not enter the public snapshot');

    await studio.getByRole('button', { name: '非公開にする' }).click();
    await studio.getByRole('button', { name: '公開に戻す' }).waitFor();
    assert.equal(await textarea.inputValue(), unsavedBeforePublication,
      'hiding an item must preserve the unsaved author buffer');
    assert.equal((await reader.request.get(base + '/api/public/items/' + created.id)).status(), 404,
      'anonymous direct API access must be blocked after hiding');
    await readerPage.goto(base + '/series/' + created.id);
    assert.ok(!(await readerPage.locator('body').innerText()).includes(title),
      'hidden series title must not appear in anonymous direct browser navigation');

    await studio.getByRole('button', { name: '公開に戻す' }).click();
    await studio.getByRole('button', { name: '非公開にする' }).waitFor();
    assert.equal(await textarea.inputValue(), unsavedBeforePublication,
      'restoring visibility must preserve the unsaved author buffer');
    const restoredPublic = await reader.request.get(base + '/api/public/items/' + created.id);
    assert.equal(restoredPublic.status(), 200);
    assert.equal((await restoredPublic.json()).content.body, 'ブラウザから保存した公開用の説明',
      'restoring visibility must not publish an unsaved draft');

    // Cancelling the native discard warning must preserve unsaved text.
    await textarea.fill('下書き未保存の編集内容');
    studio.once('dialog', dialog => dialog.dismiss());
    await studio.getByRole('button', { name: '新規シリーズ' }).click();
    assert.equal(await textarea.inputValue(), '下書き未保存の編集内容');
    studio.once('dialog', dialog => dialog.dismiss());
    await studio.getByRole('link', { name: 'メモ', exact: true }).click();
    assert.equal(new URL(studio.url()).pathname, '/studio',
      'cancelled nested-route navigation must retain the editor');
    assert.equal(await textarea.inputValue(), '下書き未保存の編集内容');

    studio.once('dialog', dialog => dialog.accept());
    await studio.getByRole('link', { name: 'メモ', exact: true }).click();
    await studio.getByRole('heading', { name: 'メモ', exact: true }).waitFor();

    // The chapter editor must preserve the selected text and place the caret
    // inside the reading field when inserting ruby markup.
    const manuscript = await author.newPage();
    await manuscript.goto(base + '/studio?item=' + fixture.chapter);
    const chapterBody = manuscript.locator('.studio-editor textarea');
    await chapterBody.waitFor();
    await chapterBody.fill('漢字');
    await chapterBody.evaluate(element => {
      element.focus();
      element.setSelectionRange(0, 2);
    });
    await manuscript.getByRole('button', { name: '選択文字にルビを付ける' }).click();
    assert.equal(await chapterBody.inputValue(), '｜漢字《よみ》');
    const readingSelection = await chapterBody.evaluate(element =>
      element.value.slice(element.selectionStart, element.selectionEnd));
    assert.equal(readingSelection, 'よみ');

    // Direct child routes of the author workspace must render their own pages.
    const adminViews = await author.newPage();
    for (const [path, heading] of [
      ['/studio/memos', 'メモ'],
      ['/studio/order', '並べ替え'],
      ['/studio/publication', '公開管理'],
    ]) {
      await adminViews.goto(base + path);
      await adminViews.getByRole('heading', { name: heading, exact: true }).waitFor();
    }
    await author.close();
    await reader.close();
  } finally {
    await browser.close();
  }
});
