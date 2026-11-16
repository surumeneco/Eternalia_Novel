/** LG-05 author UI: a word's POS is picked from its language master, not typed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

test('LG-05: author creation and meaning editor never offer unregistered POS free-text',
  { timeout: 90_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback required');
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addCookies([{ name: 'eternalia_author', value: fixture.authorToken,
        url: base, httpOnly: true, sameSite: 'Lax' }]);
      const authorRequest = context.request;
      async function create(kind, parentId, title, details = {}) {
        const response = await authorRequest.post(base + '/api/admin/nodes', {
          headers: { Origin: base },
          data: { kind, parentId, content: { title, body: '', details } },
        });
        assert.equal(response.status(), 201, await response.text());
        return (await response.json()).id;
      }
      const prefix = fixture.prefix + '-pos-master-input';
      const series = await create('series', null, prefix + '-world');
      const emptyLanguage = await create('language', series, prefix + '-empty', {
        characters: '[]', wordClasses: '[]',
      });
      const noun = { id: randomUUID(), name: '名詞', description: '名詞の説明' };
      const registeredLanguage = await create('language', series, prefix + '-registered', {
        characters: '[]', wordClasses: JSON.stringify([noun]),
      });
      const emptyWord = await create('word', emptyLanguage, prefix + '-word', { meanings: '[]' });
      const page = await context.newPage();

      await page.goto(base + '/studio?create=word&parent=' + emptyLanguage);
      const emptyCreate = page.getByLabel('新しい意味の品詞');
      await emptyCreate.waitFor();
      assert.equal(await emptyCreate.evaluate(el => el.tagName.toLowerCase()), 'select');
      assert.equal(await emptyCreate.isDisabled(), true,
        'an empty master must not switch the POS field into a text input');
      assert.equal(await page.locator('form.create-form input[maxlength="80"]').count(), 0);
      await page.getByText('マスタ未登録の品詞は入力できません。', { exact: false }).waitFor();

      await page.goto(base + '/studio?create=word&parent=' + registeredLanguage);
      const registeredCreate = page.getByLabel('新しい意味の品詞');
      await registeredCreate.waitFor();
      assert.equal(await registeredCreate.isEnabled(), true);
      const choices = await registeredCreate.locator('option').evaluateAll(options => options.map(o => o.value));
      assert.deepEqual(choices, ['', noun.id], 'registered master IDs only');
      assert.equal(await page.locator('form.create-form input[maxlength="80"]').count(), 0);
      await registeredCreate.selectOption(noun.id);
      assert.equal(await registeredCreate.inputValue(), noun.id);
      await registeredCreate.selectOption(''); // avoid unsaved-input navigation prompt

      await page.goto(base + '/studio?item=' + emptyWord);
      await page.getByRole('heading', { name: '単語：' + prefix + '-word' }).waitFor();
      await page.getByRole('button', { name: '意味を追加' }).click();
      const meaningEditor = page.locator('fieldset.word-meanings section.word-meaning');
      await meaningEditor.waitFor();
      const emptyEdit = meaningEditor.locator('select').first();
      await emptyEdit.waitFor();
      assert.equal(await emptyEdit.evaluate(el => el.tagName.toLowerCase()), 'select');
      assert.equal(await emptyEdit.isDisabled(), true);
      assert.equal(await page.locator('.word-meanings input[type="text"]').count(), 0);
      assert.equal(await emptyEdit.locator('option').count(), 1, 'no invented POS option');

      await page.close();
      await context.close();
    } finally {
      await browser.close();
    }
  });


test('LG-05: a draft-only POS ID remains private until its owning language master is published', {
  timeout: 90_000,
}, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await author.addCookies([{ name: 'eternalia_author', value: fixture.authorToken,
      url: base, httpOnly: true, sameSite: 'Lax' }]);
    const reader = await browser.newContext();
    const prefix = fixture.prefix + '-pos-snapshot-' + randomUUID().slice(0, 8);
    const existingClass = { id: randomUUID(), name: '名詞', description: '' };
    const pendingClassId = randomUUID();
    const secretName = prefix + '-draft-only-class';
    const publicName = prefix + '-released-class';

    async function create(kind, parentId, title, details = {}) {
      const response = await author.request.post(base + '/api/admin/nodes', {
        headers: { Origin: base },
        data: { kind, parentId, content: { title, body: '', details } },
      });
      assert.equal(response.status(), 201, await response.text());
      return (await response.json()).id;
    }
    async function authorNode(id) {
      const response = await author.request.get(base + '/api/admin/nodes');
      assert.equal(response.status(), 200, await response.text());
      const node = (await response.json()).find(entry => entry.id === id);
      assert.ok(node, 'missing author node: ' + id);
      return node;
    }
    async function publish(id) {
      const response = await author.request.post(base + '/api/admin/nodes/' + id + '/publish', {
        headers: { Origin: base },
        data: { expectedRevision: (await authorNode(id)).revision },
      });
      assert.equal(response.status(), 200, await response.text());
    }
    async function setDraftMaster(id, classes) {
      const node = await authorNode(id);
      const response = await author.request.patch(base + '/api/admin/nodes/' + id, {
        headers: { Origin: base },
        data: { expectedRevision: node.revision, content: {
          ...node.draft,
          details: { ...node.draft.details, wordClasses: JSON.stringify(classes) },
        } },
      });
      assert.equal(response.status(), 200, await response.text());
    }
    async function publicMeaning(id) {
      const response = await reader.request.get(base + '/api/public/items/' + id);
      assert.equal(response.status(), 200, await response.text());
      return JSON.parse((await response.json()).content.details.meanings)[0];
    }

    const series = await create('series', null, prefix + '-series');
    const language = await create('language', series, prefix + '-language', {
      characters: '[]', wordClasses: JSON.stringify([existingClass]),
    });
    await publish(series);
    await publish(language);
    await setDraftMaster(language, [existingClass,
      { id: pendingClassId, name: secretName, description: '' }]);

    const wordName = prefix + '-word';
    const word = await create('word', language, wordName, {
      meanings: JSON.stringify([{
        id: randomUUID(), partOfSpeechId: pendingClassId,
        definition: '公開された意味の説明', etymologies: [],
      }]),
    });
    await publish(word);
    const wordRevision = (await authorNode(word)).revision;

    // The Word is public, but its POS ID and draft name are not in the published language master.
    const hidden = await publicMeaning(word);
    assert.equal(hidden.partOfSpeechId, '', 'unpublished master IDs must be masked');
    assert.equal(hidden.partOfSpeech ?? '', '', 'draft-only class name must be masked');

    const detail = await reader.newPage();
    await detail.goto(base + '/items/' + word);
    await detail.locator('.meaning-definition').getByText('公開された意味の説明').waitFor();
    assert.equal(await detail.locator('.meaning-class').count(), 0);

    const listing = await reader.newPage();
    await listing.goto(base + '/dictionaries/' + series);
    const publicFilter = listing.getByLabel('品詞');
    await publicFilter.waitFor();
    assert.equal(await publicFilter.locator('option').allTextContents().then(
      options => options.some(text => text.includes(secretName))), false);

    const editor = await author.newPage();
    await editor.goto(base + '/studio?item=' + word);
    await editor.getByRole('heading', { name: '単語：' + wordName }).waitFor();
    const selected = editor.locator('fieldset.word-meanings section.word-meaning select').first();
    assert.equal(await selected.inputValue(), pendingClassId,
      'author must retain the stable draft POS reference');
    assert.equal((await selected.locator('option:checked').textContent())?.trim(), secretName);

    // Change only the language master draft, then explicitly publish it.
    await setDraftMaster(language, [existingClass,
      { id: pendingClassId, name: publicName, description: '' }]);
    assert.equal((await publicMeaning(word)).partOfSpeechId, '');
    await publish(language);

    const revealed = await publicMeaning(word);
    assert.equal(revealed.partOfSpeechId, pendingClassId);
    assert.equal(revealed.partOfSpeech, publicName);
    assert.equal((await authorNode(word)).revision, wordRevision,
      'publishing the language master must not mutate or republish the word');

    await detail.reload();
    await detail.locator('.meaning-class').getByText(publicName, { exact: true }).waitFor();
    await listing.reload();
    await publicFilter.getByRole('option', { name: publicName }).waitFor();
    assert.equal(await listing.getByText(secretName).count(), 0,
      'the superseded draft-only name must not appear in the reader');

    await editor.close();
    await listing.close();
    await detail.close();
    await reader.close();
    await author.close();
  } finally {
    await browser.close();
  }
});
