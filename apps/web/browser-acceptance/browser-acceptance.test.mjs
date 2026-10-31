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

    // AC-65: all four public domain pages must remain within the document
    // viewport on representative phone, tablet and desktop widths.
    for (const width of [390, 768, 1280]) {
      await readerPage.setViewportSize({ width, height: 844 });
      for (const domain of ['stories', 'tips', 'dictionaries', 'timeline']) {
        await readerPage.goto(base + '/' + domain + '/' + fixture.seriesA);
        const dimensions = await readerPage.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        }));
        assert.ok(dimensions.content <= dimensions.viewport + 2,
          domain + ' horizontal overflow at ' + width + 'px: ' + JSON.stringify(dimensions));
      }
    }
    await readerPage.setViewportSize({ width: 390, height: 844 });

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

    // PB-05: a future start time hides the published snapshot even when the
    // public flag remains enabled; clearing the date restores it unchanged.
    const publishDate = studio.getByLabel('公開開始日時');
    await publishDate.fill('2100-01-01T00:00');
    await studio.getByRole('button', { name: '日時を設定' }).click();
    await studio.getByText('公開条件を変更しました。').waitFor();
    assert.equal((await reader.request.get(base + '/api/public/items/' + created.id)).status(), 404,
      'future publication date must hide the direct anonymous endpoint');
    // Clear the future schedule through the separate publication management
    // screen. An empty date must be accepted as immediate publication.
    const publicationManagement = await author.newPage();
    await publicationManagement.goto(base + '/studio/publication');
    const visibilityFilter = publicationManagement.getByLabel('公開状態');
    await visibilityFilter.selectOption('visible');
    await publicationManagement.getByRole('heading', { name: fixture.prefix + '-world-A', exact: true }).waitFor();
    assert.equal(await publicationManagement.getByRole('heading', { name: title, exact: true }).count(), 0,
      'future-scheduled series must not appear in the visible filter');
    await visibilityFilter.selectOption('hidden');
    await publicationManagement.getByRole('heading', { name: title, exact: true }).waitFor();
    assert.equal(await publicationManagement.getByRole('heading', { name: fixture.prefix + '-world-A', exact: true }).count(), 0,
      'already public series must not appear in the hidden filter');
    await visibilityFilter.selectOption('all');
    const managedRow = publicationManagement.locator('.publication-row').filter({
      has: publicationManagement.getByRole('heading', { name: title, exact: true }),
    });
    await managedRow.locator('input[type="datetime-local"]').fill('');
    await managedRow.getByRole('button', { name: '日時を保存' }).click();
    await publicationManagement.getByText('公開開始日時を更新しました。').waitFor();

    // AC-14: a successful mutation followed by a failed readback is not a
    // verified success. Do not silently acknowledge a stale management view.
    await managedRow.locator('input[type="datetime-local"]').fill('2100-01-01T00:00');
    await publicationManagement.route('**/api/admin/nodes', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"test readback failure"}' });
      } else {
        await route.continue();
      }
    });
    await managedRow.getByRole('button', { name: '日時を保存' }).click();
    await publicationManagement.getByText('公開管理データを取得できません。').waitFor();
    assert.equal(await publicationManagement.getByText('公開開始日時を更新しました。').count(), 0,
      'a failed post-write readback must not be reported as verified success');
    await publicationManagement.unroute('**/api/admin/nodes');
    await publicationManagement.getByRole('button', { name: '再読込' }).click();
    await managedRow.locator('input[type="datetime-local"]').fill('');
    await managedRow.getByRole('button', { name: '日時を保存' }).click();
    await publicationManagement.getByText('公開開始日時を更新しました。').waitFor();
    await publicationManagement.close();
    const afterScheduleClear = await reader.request.get(base + '/api/public/items/' + created.id);
    assert.equal(afterScheduleClear.status(), 200, 'clearing a schedule restores public access');
    assert.equal((await afterScheduleClear.json()).content.body, 'ブラウザから保存した公開用の説明');
    assert.equal(await textarea.inputValue(), unsavedBeforePublication,
      'publication date changes must preserve the unsaved author buffer');

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

    // AC-65: native keyboard Undo must remove only the toolbar insertion,
    // not the manuscript typed before it. A direct textarea value assignment
    // is not part of Chromium's native undo stack.
    await chapterBody.fill('');
    await chapterBody.pressSequentially('東京');
    await chapterBody.evaluate(element => {
      element.focus();
      element.setSelectionRange(0, 2);
    });
    await manuscript.getByRole('button', { name: '選択文字にルビを付ける' }).click();
    assert.equal(await chapterBody.inputValue(), '｜東京《よみ》');
    await chapterBody.press('Control+z');
    assert.equal(await chapterBody.inputValue(), '東京',
      'Undo must revert only the ruby toolbar insertion');

    await chapterBody.fill('');
    await chapterBody.pressSequentially('甲乙');
    await chapterBody.evaluate(element => {
      element.focus();
      element.setSelectionRange(1, 2);
    });
    await manuscript.getByRole('button', { name: 'ページ区切りを挿入' }).click();
    assert.equal(await chapterBody.inputValue(), '甲[[page]]乙',
      'page marker insertion must preserve the selected manuscript text');
    await chapterBody.press('Control+z');
    assert.equal(await chapterBody.inputValue(), '甲乙',
      'Undo must revert only the page marker insertion');

    await chapterBody.dispatchEvent('compositionstart');
    assert.equal(await manuscript.getByRole('button', { name: '選択文字にルビを付ける' }).isDisabled(), true,
      'toolbar must not modify a composing IME buffer');
    await chapterBody.dispatchEvent('compositionend');
    assert.equal(await manuscript.getByRole('button', { name: '選択文字にルビを付ける' }).isEnabled(), true);

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
    // A6/W6.1: exercise the actual studio visibility controls for one
    // published item from each domain, then restore the original state.
    // The later HTTP acceptance tests share these disposable fixtures.
    const visibilityPage = await author.newPage();
    for (const [kind, id, directPath] of [
      ['chapter', fixture.chapter, '/read/'],
      ['tipSection', fixture.section, '/items/'],
      ['word', fixture.word, '/items/'],
      ['event', fixture.event, '/items/'],
    ]) {
      const beforeResponse = await reader.request.get(base + '/api/public/items/' + id);
      assert.equal(beforeResponse.status(), 200, kind + ' initially public');
      const before = await beforeResponse.json();
      await visibilityPage.goto(base + '/studio?item=' + id);
      const hide = visibilityPage.getByRole('button', { name: '非公開にする' });
      const restore = visibilityPage.getByRole('button', { name: '公開に戻す' });
      await hide.waitFor();
      await hide.click();
      await restore.waitFor();
      assert.equal((await reader.request.get(base + '/api/public/items/' + id)).status(), 404,
        kind + ' must be inaccessible to anonymous readers while private');
      await readerPage.goto(base + directPath + id);
      assert.ok(!(await readerPage.locator('body').innerText()).includes(before.content.title),
        kind + ' private title must not leak in the direct reader view');
      await restore.click();
      await hide.waitFor();
      const reopenedResponse = await reader.request.get(base + '/api/public/items/' + id);
      assert.equal(reopenedResponse.status(), 200, kind + ' should reopen');
      const reopened = await reopenedResponse.json();
      assert.deepEqual(reopened.content, before.content,
        kind + ' visibility changes must preserve the published snapshot');
    }
    await visibilityPage.close();
    await author.close();
    await reader.close();
  } finally {
    await browser.close();
  }
});

test('author browser saves and explicitly publishes chapter, setting, word and event', { timeout: 120_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback acceptance URL required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const anonymous = await browser.newContext();
    const page = await author.newPage();
    const prefix = fixture.prefix + '-four-domain-browser';

    async function create(kind, parentId, suffix, details = {}) {
      const response = await author.request.post(base + '/api/admin/nodes', {
        headers: { Origin: base },
        data: { kind, parentId, content: { title: prefix + '-' + suffix, body: '', details } },
      });
      assert.equal(response.status(), 201, 'create ' + kind + ': ' + await response.text());
      return (await response.json()).id;
    }
    async function publish(id, revision = 1) {
      const response = await author.request.post(base + '/api/admin/nodes/' + id + '/publish', {
        headers: { Origin: base }, data: { expectedRevision: revision },
      });
      assert.equal(response.status(), 200, 'publish ancestor: ' + await response.text());
    }
    async function publicItem(id) {
      const response = await anonymous.request.get(base + '/api/public/items/' + id);
      return { status: response.status(), value: response.status() === 200 ? await response.json() : null };
    }

    const series = await create('series', null, 'series');
    const volume = await create('volume', series, 'volume');
    const part = await create('part', volume, 'part');
    const chapter = await create('chapter', part, 'chapter');
    const category = await create('category', series, 'category', { presets: '[]' });
    const tip = await create('tip', category, 'tip');
    const section = await create('tipSection', tip, 'section');
    const language = await create('language', series, 'language', { characters: '[]', wordClasses: '[]' });
    const word = await create('word', language, 'word', { meanings: '[]' });
    const period = await create('periodization', series, 'period');
    const event = await create('event', period, 'event', { year: '1' });
    for (const id of [series, volume, part, category, tip, language, period]) await publish(id);

    for (const [kind, id] of [
      ['chapter', chapter], ['tipSection', section], ['word', word], ['event', event],
    ]) {
      await page.goto(base + '/studio?item=' + id);
      const editor = page.locator('.studio-editor textarea');
      await editor.waitFor();
      const first = prefix + '-' + kind + '-first-publication';
      const second = prefix + '-' + kind + '-second-publication';
      await editor.fill(first);
      if (kind === 'word') {
        await page.getByRole('button', { name: '意味を追加' }).click();
        await page.locator('.word-meaning textarea').first().fill('第一の意味');
        await page.getByRole('button', { name: '語源を追加' }).click();
        await page.locator('.word-origin textarea').first().fill('語源は意味単位で保存');
      }
      await page.getByRole('button', { name: '下書きを保存' }).click();
      await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
      assert.equal((await publicItem(id)).status, 404, kind + ' saved draft must remain private');

      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: '保存済み下書きを公開版へ反映' }).click();
      await page.getByText('公開スナップショットを更新しました。').waitFor();
      const firstPublic = await publicItem(id);
      assert.equal(firstPublic.value?.content.body, first, kind + ' first publication');
      if (kind === 'word') {
        const meanings = JSON.parse(firstPublic.value.content.details.meanings);
        assert.equal(meanings.length, 1);
        assert.equal(meanings[0].definition, '第一の意味');
        assert.equal(meanings[0].etymologies.length, 1);
        assert.equal(meanings[0].etymologies[0].note, '語源は意味単位で保存');
        assert.match(meanings[0].id, /^[0-9a-f-]{36}$/i);
        assert.match(meanings[0].etymologies[0].id, /^[0-9a-f-]{36}$/i);
      }

      await editor.fill(second);
      await page.getByRole('button', { name: '下書きを保存' }).click();
      await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
      assert.equal((await publicItem(id)).value?.content.body, first,
        kind + ' second draft must not change public snapshot');

      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: '保存済み下書きを公開版へ反映' }).click();
      await page.getByText('公開スナップショットを更新しました。').waitFor();
      assert.equal((await publicItem(id)).value?.content.body, second, kind + ' explicit republish');
    }
    await anonymous.close();
    await author.close();
  } finally {
    await browser.close();
  }
});

test('author memo browser persists tags and handles failed post-write readback', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback acceptance URL required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const page = await author.newPage();
    await page.goto(base + '/studio/memos');
    await page.getByRole('button', { name: '新規メモ' }).click();
    const title = fixture.prefix + '-browser-memo';
    await page.locator('.memo-editor input').first().fill(title);
    const editor = page.locator('.memo-editor textarea');
    await editor.fill('メモ本文の初稿');
    await page.locator('.memo-editor input').nth(1).fill('人物, 調査');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await page.getByText('メモを保存しました。').waitFor();

    const listResponse = await author.request.get(base + '/api/admin/memos');
    assert.equal(listResponse.status(), 200);
    const created = (await listResponse.json()).find(memo => memo.title === title);
    assert.ok(created?.id, 'memo must persist to PostgreSQL');
    assert.deepEqual(created.tags, ['人物', '調査']);
    await page.locator('.memo-sidebar input[type="search"]').fill('調査');
    await page.getByRole('button', { name: new RegExp(title) }).waitFor();

    await editor.fill('未保存のメモ変更');
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByLabel('パンくずリスト').getByRole('link', { name: '作者の書斎' }).click();
    assert.equal(new URL(page.url()).pathname, '/studio/memos');
    assert.equal(await editor.inputValue(), '未保存のメモ変更');

    await page.route('**/api/admin/memos', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"test readback failure"}' });
      } else {
        await route.continue();
      }
    });
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await page.getByText('メモを取得できませんでした。').waitFor();
    assert.equal(await page.getByText('メモを保存しました。').count(), 0,
      'memo save must not claim verified success after failed readback');

    await page.unroute('**/api/admin/memos');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '再読込' }).click();
    assert.equal(await editor.inputValue(), '未保存のメモ変更',
      'reloading after a successful write must recover the persisted edit');
    const finalResponse = await author.request.get(base + '/api/admin/memos');
    assert.equal(finalResponse.status(), 200);
    const finalMemo = (await finalResponse.json()).find(memo => memo.id === created.id);
    assert.equal(finalMemo.body, '未保存のメモ変更');
    assert.ok(finalMemo.revision > created.revision);
    await author.close();
  } finally {
    await browser.close();
  }
});

test('author browser reorders only sibling chapters and protects unapplied changes', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback acceptance URL required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const prefix = fixture.prefix + '-browser-order';
    async function create(kind, parentId, suffix) {
      const response = await author.request.post(base + '/api/admin/nodes', {
        headers: { Origin: base },
        data: { kind, parentId, content: { title: prefix + '-' + suffix, body: '', details: {} } },
      });
      assert.equal(response.status(), 201, 'create ' + kind + ': ' + await response.text());
      return (await response.json()).id;
    }
    const series = await create('series', null, 'series');
    const volume = await create('volume', series, 'volume');
    const part = await create('part', volume, 'part');
    const first = await create('chapter', part, 'first');
    const second = await create('chapter', part, 'second');
    const page = await author.newPage();
    await page.goto(base + '/studio/order');
    await page.getByLabel('親となる項目').selectOption(part);
    await page.getByLabel('項目の種類').selectOption('chapter');
    const list = page.locator('.order-list li');
    await list.first().waitFor();
    assert.ok((await list.nth(0).innerText()).includes(prefix + '-first'));
    assert.ok((await list.nth(1).innerText()).includes(prefix + '-second'));
    await list.nth(0).getByRole('button', { name: '下へ' }).click();
    assert.ok((await list.nth(0).innerText()).includes(prefix + '-second'));

    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('link', { name: '執筆・編集に戻る' }).click();
    assert.equal(new URL(page.url()).pathname, '/studio/order',
      'cancelling the discard dialog must retain unapplied ordering');
    assert.ok((await list.nth(0).innerText()).includes(prefix + '-second'));

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '表示順を反映' }).click();
    await page.getByText('順序を反映しました。').waitFor();
    const response = await author.request.get(base + '/api/admin/nodes');
    assert.equal(response.status(), 200);
    const nodes = await response.json();
    const firstNode = nodes.find(node => node.id === first);
    const secondNode = nodes.find(node => node.id === second);
    assert.equal(firstNode?.order, 1);
    assert.equal(secondNode?.order, 0);
    assert.equal(firstNode?.draft.body, '');
    assert.equal(secondNode?.draft.body, '');
    await author.close();
  } finally {
    await browser.close();
  }
});

test('anonymous browser cannot access author workspace data or editing controls', { timeout: 60_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback acceptance URL required');
  const browser = await chromium.launch({ headless: true });
  try {
    const anonymous = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await anonymous.newPage();
    for (const [path, privateSelector] of [
      ['/studio', '.studio-editor textarea'],
      ['/studio/memos', '.memo-editor'],
      ['/studio/order', '.order-list'],
      ['/studio/publication', '.publication-list'],
    ]) {
      await page.goto(base + path);
      await page.getByRole('link', { name: 'Discordでログイン' }).waitFor();
      assert.equal(await page.locator(privateSelector).count(), 0,
        path + ' must not render private author controls without a session');
    }
    for (const path of ['/api/admin/nodes', '/api/admin/memos']) {
      assert.equal((await anonymous.request.get(base + path)).status(), 401,
        path + ' must not expose private data');
    }
    await anonymous.close();
  } finally {
    await browser.close();
  }
});

test('category preset editor copies only into newly created setting children', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback acceptance URL required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const prefix = fixture.prefix + '-preset-browser';
    async function create(kind, parentId, suffix, details = {}) {
      const response = await author.request.post(base + '/api/admin/nodes', {
        headers: { Origin: base },
        data: { kind, parentId, content: { title: prefix + '-' + suffix, body: '', details } },
      });
      assert.equal(response.status(), 201, 'create ' + kind + ': ' + await response.text());
      return (await response.json()).id;
    }
    async function nodes() {
      const response = await author.request.get(base + '/api/admin/nodes');
      assert.equal(response.status(), 200);
      return response.json();
    }
    const series = await create('series', null, 'series');
    const category = await create('category', series, 'category', { presets: '[]' });
    const page = await author.newPage();
    await page.goto(base + '/studio?item=' + category);
    const presets = page.locator('.presets-editor');
    await presets.getByRole('button', { name: '項目を追加' }).click();
    await presets.locator('input').first().fill('最初の項目');
    await presets.locator('textarea').first().fill('最初の本文');
    await page.getByRole('button', { name: '下書きを保存' }).click();
    await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();

    const firstTip = await create('tip', category, 'first-tip');
    const firstSection = (await nodes()).find(node => node.kind === 'tipSection' && node.parentId === firstTip);
    assert.equal(firstSection?.draft.title, '最初の項目');
    assert.equal(firstSection?.draft.body, '最初の本文');

    await presets.locator('input').first().fill('更新後の項目');
    await page.getByRole('button', { name: '下書きを保存' }).click();
    await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
    const oldSection = (await nodes()).find(node => node.id === firstSection.id);
    assert.equal(oldSection.draft.title, '最初の項目',
      'existing setting sections must not inherit later preset changes');

    const secondTip = await create('tip', category, 'second-tip');
    const secondSection = (await nodes()).find(node => node.kind === 'tipSection' && node.parentId === secondTip);
    assert.equal(secondSection?.draft.title, '更新後の項目');
    assert.equal(secondSection?.draft.body, '最初の本文');
    await author.close();
  } finally {
    await browser.close();
  }
});

test('related setting links exclude hidden targets from public projection', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback acceptance URL required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const anonymous = await browser.newContext();
    const prefix = fixture.prefix + '-tip-links-browser';
    async function create(kind, parentId, suffix, details = {}) {
      const response = await author.request.post(base + '/api/admin/nodes', {
        headers: { Origin: base },
        data: { kind, parentId, content: { title: prefix + '-' + suffix, body: '', details } },
      });
      assert.equal(response.status(), 201, 'create ' + kind + ': ' + await response.text());
      return (await response.json()).id;
    }
    async function publish(id, revision = 1) {
      const response = await author.request.post(base + '/api/admin/nodes/' + id + '/publish', {
        headers: { Origin: base }, data: { expectedRevision: revision },
      });
      assert.equal(response.status(), 200);
    }
    const series = await create('series', null, 'series');
    const category = await create('category', series, 'category', { presets: '[]' });
    const source = await create('tip', category, 'source');
    const target = await create('tip', category, 'target');
    for (const id of [series, category, target]) await publish(id);
    const page = await author.newPage();
    await page.goto(base + '/studio?item=' + source);
    const links = page.locator('.tip-links-editor');
    await links.locator('input').fill('人物, 地名');
    await links.locator('select').selectOption(target);
    await links.getByRole('button', { name: '関連に追加' }).click();
    await page.getByRole('button', { name: '下書きを保存' }).click();
    await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
    assert.equal((await anonymous.request.get(base + '/api/public/items/' + source)).status(), 404);
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '保存済み下書きを公開版へ反映' }).click();
    await page.getByText('公開スナップショットを更新しました。').waitFor();

    const visibleResponse = await anonymous.request.get(base + '/api/public/items/' + source);
    assert.equal(visibleResponse.status(), 200);
    const visible = (await visibleResponse.json()).content.details;
    assert.deepEqual(JSON.parse(visible.tags), ['人物', '地名']);
    assert.deepEqual(JSON.parse(visible.relatedTips).map(item => item.id), [target]);

    const hideResponse = await author.request.post(base + '/api/admin/nodes/' + target + '/visibility', {
      headers: { Origin: base },
      data: { expectedRevision: 1, isPublic: false, publicSince: null },
    });
    assert.equal(hideResponse.status(), 200);
    const hiddenResponse = await anonymous.request.get(base + '/api/public/items/' + source);
    assert.equal(hiddenResponse.status(), 200);
    assert.deepEqual(JSON.parse((await hiddenResponse.json()).content.details.relatedTips), [],
      'private target must not leak through public related settings');
    const adminResponse = await author.request.get(base + '/api/admin/nodes');
    assert.equal(adminResponse.status(), 200);
    const authorSource = (await adminResponse.json()).find(node => node.id === source);
    assert.deepEqual(JSON.parse(authorSource.draft.details.relatedTipIds), [target],
      'hiding the target must not delete the author relationship');
    await anonymous.close();
    await author.close();
  } finally {
    await browser.close();
  }
});

test('language editor persists character adjacency and word classes before publication', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback acceptance URL required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const anonymous = await browser.newContext();
    const prefix = fixture.prefix + '-language-browser';
    async function create(kind, parentId, suffix, details = {}) {
      const response = await author.request.post(base + '/api/admin/nodes', {
        headers: { Origin: base },
        data: { kind, parentId, content: { title: prefix + '-' + suffix, body: '', details } },
      });
      assert.equal(response.status(), 201, 'create ' + kind + ': ' + await response.text());
      return (await response.json()).id;
    }
    const series = await create('series', null, 'series');
    const language = await create('language', series, 'language', { characters: '[]', wordClasses: '[]' });
    const page = await author.newPage();
    await page.goto(base + '/studio?item=' + language);
    const structure = page.locator('.language-structure');
    await structure.getByRole('button', { name: '文字を追加' }).click();
    await structure.getByRole('button', { name: '文字を追加' }).click();
    const entries = structure.locator(':scope > fieldset').first().locator('.symbol-entry');
    await entries.nth(0).locator('input').nth(0).fill('a');
    await entries.nth(0).locator('input').nth(1).fill('a');
    await entries.nth(1).locator('input').nth(0).fill('b');
    await entries.nth(1).locator('input').nth(1).fill('b');
    await entries.nth(0).locator('.following-grid input').nth(1).check();
    await structure.getByRole('button', { name: '品詞を追加' }).click();
    const wordClass = structure.locator(':scope > fieldset').nth(1).locator('.symbol-entry');
    await wordClass.locator('input').fill('名詞');
    await wordClass.locator('textarea').fill('物事の名称');
    await page.getByRole('button', { name: '下書きを保存' }).click();
    await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();

    const adminResponse = await author.request.get(base + '/api/admin/nodes');
    assert.equal(adminResponse.status(), 200);
    const draft = (await adminResponse.json()).find(node => node.id === language).draft.details;
    const chars = JSON.parse(draft.characters);
    const classes = JSON.parse(draft.wordClasses);
    assert.deepEqual(chars.map(entry => entry.glyph), ['a', 'b']);
    assert.deepEqual(chars[0].nextIds, [chars[1].id]);
    assert.deepEqual(classes.map(entry => entry.name), ['名詞']);
    assert.equal(classes[0].description, '物事の名称');

    for (const [id, revision] of [[series, 1], [language, 2]]) {
      const response = await author.request.post(base + '/api/admin/nodes/' + id + '/publish', {
        headers: { Origin: base }, data: { expectedRevision: revision },
      });
      assert.equal(response.status(), 200);
    }
    const publicResponse = await anonymous.request.get(base + '/api/public/items/' + language);
    assert.equal(publicResponse.status(), 200);
    const published = (await publicResponse.json()).content.details;
    assert.deepEqual(JSON.parse(published.characters), chars);
    assert.deepEqual(JSON.parse(published.wordClasses), classes);
    await anonymous.close();
    await author.close();
  } finally {
    await browser.close();
  }
});

test('anonymous search finds published words but never private or unpublished text', { timeout: 60_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback acceptance URL required');
  const browser = await chromium.launch({ headless: true });
  try {
    const anonymous = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await anonymous.newPage();
    await page.goto(base + '/search?series=' + fixture.seriesA);
    const query = page.getByLabel('検索語');
    const domain = page.locator('.search-filters select').nth(1);
    await query.fill(fixture.prefix + '-visible-word-body');
    const wordLink = page.getByRole('link', { name: fixture.prefix + '-visible-word', exact: true });
    await wordLink.waitFor();
    await domain.selectOption('tips');
    assert.equal(await wordLink.count(), 0, 'dictionary word must be excluded from settings filter');
    await domain.selectOption('dictionaries');
    await wordLink.waitFor();
    await domain.selectOption('all');

    await query.fill(fixture.prefix + '-private-content');
    await page.getByText('条件に一致する公開資料はありません。').waitFor();
    assert.ok(!(await page.locator('body').innerText()).includes(fixture.prefix + '-private-tip'));
    await query.fill(fixture.prefix + '-unpublished');
    await page.getByText('条件に一致する公開資料はありません。').waitFor();
    assert.ok(!(await page.locator('body').innerText()).includes(fixture.prefix + '-unpublished-tip'));
    await anonymous.close();
  } finally {
    await browser.close();
  }
});
