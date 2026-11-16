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
      assert.deepEqual(choices, ['', '名詞'], 'registered master choices only');
      assert.equal(await page.locator('form.create-form input[maxlength="80"]').count(), 0);
      await registeredCreate.selectOption('名詞');
      assert.equal(await registeredCreate.inputValue(), '名詞');
      await registeredCreate.selectOption(''); // avoid unsaved-input navigation prompt

      await page.goto(base + '/studio?item=' + emptyWord);
      await page.getByRole('heading', { name: '単語：' + prefix + '-word' }).waitFor();
      await page.getByRole('button', { name: '意味を追加' }).click();
      const emptyEdit = page.getByLabel('品詞', { exact: true });
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
