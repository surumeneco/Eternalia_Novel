/**
 * AC-09 / LG-08: real Nuxt Studio + Nest + PostgreSQL + Chromium.
 * The original published spelling remains reserved after a draft-only rename.
 * This is an exploratory browser verification, not a CAT-generated Gate test.
 * Synthetic author cookie and disposable DB; real Discord acceptance is separate.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

test('AC-09: published X/draft Y conflict redirects to Y editor without saving or leaking', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback HTTP required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const anonymous = await browser.newContext();
    const prefix = fixture.prefix + '-published-draft-browser';
    async function nodes() {
      const response = await author.request.get(base + '/api/admin/nodes');
      assert.equal(response.status(), 200, await response.text());
      return response.json();
    }
    async function node(id) {
      const found = (await nodes()).find(item => item.id === id);
      assert.ok(found, 'expected author node: ' + id);
      return found;
    }
    async function create(kind, parentId, title, details = {}) {
      const response = await author.request.post(base + '/api/admin/nodes', {
        headers: { Origin: base },
        data: { kind, parentId, content: { title, body: '', details } },
      });
      assert.equal(response.status(), 201, await response.text());
      return (await response.json()).id;
    }
    async function publish(id) {
      const response = await author.request.post(base + '/api/admin/nodes/' + id + '/publish', {
        headers: { Origin: base }, data: { expectedRevision: (await node(id)).revision },
      });
      assert.equal(response.status(), 200, await response.text());
    }

    const series = await create('series', null, prefix + '-series');
    const nounId = randomUUID();
    const language = await create('language', series, prefix + '-language', {
      wordClasses: JSON.stringify([{ id: nounId, name: '名詞', description: '' }]),
    });
    const publishedX = prefix + '-X';
    const draftY = prefix + '-Y';
    const meanings = [{
      id: randomUUID(), partOfSpeechId: nounId, definition: '既存の意味', etymologies: [],
    }];
    const existingId = await create('word', language, publishedX, {
      meanings: JSON.stringify(meanings),
    });
    for (const id of [series, language, existingId]) await publish(id);

    const firstPublished = await anonymous.request.get(base + '/api/public/items/' + existingId);
    assert.equal(firstPublished.status(), 200);
    const originalReader = await firstPublished.json();
    assert.equal(originalReader.content.title, publishedX);

    const beforeRename = await node(existingId);
    const rename = await author.request.patch(base + '/api/admin/nodes/' + existingId, {
      headers: { Origin: base },
      data: {
        expectedRevision: beforeRename.revision,
        content: { ...beforeRename.draft, title: draftY },
      },
    });
    assert.equal(rename.status(), 200, await rename.text());
    assert.equal((await node(existingId)).draft.title, draftY);

    const page = await author.newPage();
    await page.goto(base + '/admin/series/' + series + '/dictionaries/words');
    await page.locator('.grid-create a[href="/admin/series/' + series + '/create/word/' + language + '"]').click();
    await page.locator('form.create-form').waitFor();
    await page.getByRole('textbox', { name: 'タイトル' }).fill(publishedX);
    await page.getByRole('combobox', { name: '新しい意味の品詞' }).selectOption(nounId);
    await page.getByRole('textbox', { name: '新しい意味・説明' }).fill('追加した未保存の意味');
    await page.getByRole('button', { name: '作成', exact: true }).click();

    await page.getByRole('alert').getByText('同じ言語に同じスペルが登録済みのため、新規登録できません。既存単語の編集に移りました。追記内容は未保存です。').waitFor();
    await page.getByRole('heading', { name: '単語：' + draftY }).waitFor();
    await page.waitForURL(url=>url.pathname==='/admin/series/'+series+'/dictionaries/words/'+existingId+'/edit');
    assert.equal(new URL(page.url()).search,'','unsaved meaning must not be serialized in URL');
    const editorMeanings = page.locator('.word-meaning');
    assert.equal(await editorMeanings.count(), 2);
    assert.equal(await editorMeanings.nth(0).getByRole('textbox', { name: '意味・説明' }).inputValue(), '既存の意味');
    assert.equal(await editorMeanings.nth(1).getByRole('textbox', { name: '意味・説明' }).inputValue(), '追加した未保存の意味');
    assert.equal(await editorMeanings.nth(1).locator('select').first().inputValue(), nounId);

    const afterRejected = await node(existingId);
    assert.equal(afterRejected.draft.title, draftY);
    assert.deepEqual(JSON.parse(afterRejected.draft.details.meanings), meanings,
      'rejected creation must not persist an unsaved meaning');
    assert.equal((await nodes()).filter(item =>
      item.kind === 'word' && item.parentId === language && item.draft.title === publishedX).length, 0,
    'rejected new word must not exist');
    assert.deepEqual((await (await anonymous.request.get(base + '/api/public/items/' + existingId)).json()).content,
      originalReader.content, 'draft-only rename and duplicate attempt must not alter public content');

    await page.getByRole('button', { name: '下書きを保存' }).click();
    await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
    const saved = await node(existingId);
    assert.equal(saved.draft.title, draftY);
    assert.equal(JSON.parse(saved.draft.details.meanings).length, 2);
    assert.deepEqual((await (await anonymous.request.get(base + '/api/public/items/' + existingId)).json()).content,
      originalReader.content, 'explicit draft save still must not republish X as Y');

    await publish(existingId);
    const republished = await anonymous.request.get(base + '/api/public/items/' + existingId);
    assert.equal(republished.status(), 200);
    assert.equal((await republished.json()).content.title, draftY);
    const released = await create('word', language, publishedX);
    assert.notEqual(released, existingId, 'X can be used after actual republication to Y');
    assert.equal((await anonymous.request.get(base + '/api/public/items/' + released)).status(), 404,
      'new un-published B must remain private to author until explicit publication');

    await page.close();
    await anonymous.close();
    await author.close();
  } finally {
    await browser.close();
  }
});
