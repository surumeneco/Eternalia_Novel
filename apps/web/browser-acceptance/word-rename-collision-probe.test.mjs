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

test('AC-09: rename to a held published spelling must reject and hand off unsaved meanings', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback HTTP required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const anonymous = await browser.newContext();
    const prefix = fixture.prefix + '-rename-collision-browser';
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

    const otherId = await create('word', language, prefix + '-B', {
      meanings: JSON.stringify([{id:randomUUID(),partOfSpeechId:nounId,definition:'別語の意味',etymologies:[]}]),
    });
    const beforeA=await node(existingId), beforeB=await node(otherId);
    const page=await author.newPage();
    await page.goto(base+'/admin/series/'+series+'/dictionaries/words/'+otherId+'/edit');
    const editor=page.locator('form').filter({has:page.getByRole('button',{name:'下書きを保存'})});
    await editor.getByRole('textbox',{name:'名称・見出し'}).fill(publishedX);
    await editor.locator('.word-meaning').first().getByRole('textbox',{name:'意味・説明'}).fill('改名時の未保存の意味');
    const responsePromise=page.waitForResponse(r=>r.request().method()==='PATCH' && new URL(r.url()).pathname==='/api/admin/nodes/'+otherId);
    await editor.getByRole('button',{name:'下書きを保存'}).click();
    const response=await responsePromise;
    const data=await response.json();
    assert.equal(response.status(),409);
    assert.equal(data.code,'duplicate-spelling');
    assert.equal(data.existingWordId,existingId);
    // Read both stored records independently after the rejected PATCH.
    assert.deepEqual(await node(existingId),beforeA);
    assert.deepEqual(await node(otherId),beforeB);
    assert.deepEqual((await (await anonymous.request.get(base+'/api/public/items/'+existingId)).json()).content,originalReader.content);
    const expected='/admin/series/'+series+'/dictionaries/words/'+existingId+'/edit';
    try { await page.waitForURL(u=>u.pathname===expected,{timeout:8000}); }
    catch {
      assert.fail('LG-08: 409 and stored records unchanged, but actual editor path '+new URL(page.url()).pathname+' instead of '+expected+'; alert: '+(await page.getByRole('alert').allTextContents()).join(' / '));
    }
    const editorMeanings=page.locator('.word-meaning');
    await editorMeanings.nth(1).waitFor();
    assert.equal(await editorMeanings.nth(0).getByRole('textbox',{name:'意味・説明'}).inputValue(),'既存の意味');
    assert.equal(await editorMeanings.nth(1).getByRole('textbox',{name:'意味・説明'}).inputValue(),'改名時の未保存の意味');
    assert.equal(await editorMeanings.nth(1).locator('select').first().inputValue(),nounId);
    assert.deepEqual(await node(existingId),beforeA);
    assert.deepEqual(await node(otherId),beforeB);
    await page.close();
    await anonymous.close();
    await author.close();
  } finally {
    await browser.close();
  }
});
