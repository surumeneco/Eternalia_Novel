/**
 * LG-07 / DICT-01: real reader dictionary word order after public publication.
 * Runs on disposable PostgreSQL, Nest/Nuxt and a synthetic author session.
 * This tests rendered word order, not a hypothetical sorting selector.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

test('LG-07: each public language displays spelling ascending, independent of creation order and POS filter', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback HTTP required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext();
    await author.addCookies([{ name: 'eternalia_author', value: fixture.authorToken,
      url: base, httpOnly: true, sameSite: 'Lax' }]);
    const reader = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const prefix = fixture.prefix + '-spelling-order';
    async function nodes() {
      const response = await author.request.get(base + '/api/admin/nodes');
      assert.equal(response.status(), 200, await response.text());
      return response.json();
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
      const entry = (await nodes()).find(node => node.id === id);
      assert.ok(entry);
      const response = await author.request.post(base + '/api/admin/nodes/' + id + '/publish', {
        headers: { Origin: base }, data: { expectedRevision: entry.revision },
      });
      assert.equal(response.status(), 200, await response.text());
    }
    const senses = (partOfSpeech, definition) => ({
      meanings: JSON.stringify([{ id: randomUUID(), partOfSpeech, definition, etymologies: [] }]),
    });
    const series = await create('series', null, prefix + '-series');
    const languageAName = prefix + '-language-A';
    const languageBName = prefix + '-language-B';
    const languageA = await create('language', series, languageAName);
    const languageB = await create('language', series, languageBName);
    const zeta = prefix + '-zeta';
    const alpha = prefix + '-alpha';
    const beta = prefix + '-beta';
    const omega = prefix + '-omega';
    const delta = prefix + '-delta';
    const wordIds = [
      await create('word', languageA, zeta, senses('名詞', '海')),
      await create('word', languageA, beta, senses('動詞', '歩く')),
      await create('word', languageA, alpha, senses('名詞', '空')),
      await create('word', languageB, omega, senses('動詞', '歩く')),
      await create('word', languageB, delta, senses('名詞', '空')),
    ];
    await publish(series); await publish(languageA); await publish(languageB);
    for (const id of wordIds) await publish(id);
    const page = await reader.newPage();
    await page.goto(base + '/dictionaries/' + series);
    await page.getByRole('heading', { name: languageBName }).waitFor();
    const wordsIn = async languageName => {
      const section = page.locator('.dictionary-language').filter({
        has: page.getByRole('heading', { name: languageName, exact: true }),
      });
      return section.locator('ul.reader-list').first().locator(':scope > li > a').allTextContents();
    };
    assert.deepEqual(await wordsIn(languageAName), [alpha, beta, zeta]);
    assert.deepEqual(await wordsIn(languageBName), [delta, omega]);
    // POS filtering changes membership but not relative spelling order.
    await page.getByLabel('品詞').selectOption('名詞');
    assert.deepEqual(await wordsIn(languageAName), [alpha, zeta]);
    assert.deepEqual(await wordsIn(languageBName), [delta]);
    await page.getByLabel('品詞').selectOption('');
    await page.getByLabel('言語').selectOption(languageB);
    assert.deepEqual(await wordsIn(languageBName), [delta, omega]);
    assert.equal(await page.getByRole('heading', { name: languageAName, exact: true }).count(), 0);
    await page.close();
    await reader.close();
    await author.close();
  } finally { await browser.close(); }
});
