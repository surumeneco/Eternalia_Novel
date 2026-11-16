/**
 * LG-05 / DICT-03–04: author orders a language's POS master independently of
 * reader word spelling. Real Nuxt/Nest/PostgreSQL and headless Chromium.
 * Synthetic author session and disposable DB, not real Discord acceptance.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

test('LG-05: POS master starts in creation order, supports adjacent moves, and publishes only explicitly', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback HTTP required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const reader = await browser.newContext();
    const prefix = fixture.prefix + '-pos-master-order';
    const entries = ['名詞', '動詞', '形容詞'].map(name => ({
      id: randomUUID(), name, description: name + 'の説明',
    }));
    const asNames = rows => rows.map(entry => entry.name);
    async function nodes() {
      const r = await author.request.get(base + '/api/admin/nodes');
      assert.equal(r.status(), 200, await r.text());
      return r.json();
    }
    async function getNode(id) {
      const entry = (await nodes()).find(n => n.id === id);
      assert.ok(entry, 'missing author node ' + id);
      return entry;
    }
    async function create(kind, parentId, title, details = {}) {
      const r = await author.request.post(base + '/api/admin/nodes', {
        headers: { Origin: base },
        data: { kind, parentId, content: { title, body: '', details } },
      });
      assert.equal(r.status(), 201, await r.text());
      return (await r.json()).id;
    }
    async function publish(id) {
      const r = await author.request.post(base + '/api/admin/nodes/' + id + '/publish', {
        headers: { Origin: base }, data: { expectedRevision: (await getNode(id)).revision },
      });
      assert.equal(r.status(), 200, await r.text());
    }
    async function publicClasses(id) {
      const r = await reader.request.get(base + '/api/public/items/' + id);
      assert.equal(r.status(), 200, await r.text());
      const item = await r.json();
      return JSON.parse(item.content.details.wordClasses);
    }
    const series = await create('series', null, prefix + '-series');
    const langName = prefix + '-language';
    const languageId = await create('language', series, langName, {
      characters: '[]', wordClasses: JSON.stringify(entries),
    });
    await publish(series);
    await publish(languageId);
    assert.deepEqual(await publicClasses(languageId), entries, 'creation order must be preserved in first published master');

    const page = await author.newPage();
    await page.goto(base + '/studio?item=' + languageId);
    await page.getByRole('heading', { name: '言語：' + langName }).waitFor();
    const master = page.locator('.language-structure > fieldset').nth(1);
    const names = () => master.locator('.symbol-entry input[maxlength="80"]').allInputValues();
    assert.deepEqual(await names(), ['名詞', '動詞', '形容詞']);
    assert.equal(await page.getByRole('button', { name: '名詞を上へ移動' }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: '形容詞を下へ移動' }).isDisabled(), true);
    await page.getByRole('button', { name: '動詞を上へ移動' }).click();
    assert.deepEqual(await names(), ['動詞', '名詞', '形容詞']);
    await page.getByRole('button', { name: '動詞を下へ移動' }).click();
    assert.deepEqual(await names(), ['名詞', '動詞', '形容詞']);
    await page.getByRole('button', { name: '動詞を上へ移動' }).click();
    assert.deepEqual(await names(), ['動詞', '名詞', '形容詞']);
    const expected = [entries[1], entries[0], entries[2]];
    assert.deepEqual(await publicClasses(languageId), entries, 'unsaved order must not affect public master');

    await page.getByRole('button', { name: '下書きを保存' }).click();
    await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
    const saved = await getNode(languageId);
    assert.deepEqual(JSON.parse(saved.draft.details.wordClasses), expected,
      'draft save must preserve manual order and exact IDs/descriptions');
    assert.deepEqual(await publicClasses(languageId), entries,
      'draft save alone must not change published master');
    await page.reload();
    await page.getByRole('heading', { name: '言語：' + langName }).waitFor();
    assert.deepEqual(await names(), ['動詞', '名詞', '形容詞'], 'manual order must survive reload');

    await publish(languageId);
    assert.deepEqual(await publicClasses(languageId), expected,
      'explicit publication must expose exact draft order and original IDs');
    await page.close();
    await reader.close();
    await author.close();
  } finally {
    await browser.close();
  }
});
