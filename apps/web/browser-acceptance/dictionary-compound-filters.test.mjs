/**
 * AC-67 / LG-07 / PB-03 exploratory real-browser acceptance.
 * Verifies existing compound filters and public projection, not proposed sorting.
 * Disposable PostgreSQL and synthetic author session; no real Discord login.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

test('AC-67: language, part of speech and meaning filters combine without leaking hidden words', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback HTTP required');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await browser.newContext();
    await author.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const reader = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const prefix = fixture.prefix + '-dictionary-combinations';
    async function nodes() {
      const r = await author.request.get(base + '/api/admin/nodes');
      assert.equal(r.status(), 200, await r.text());
      return r.json();
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
      const item = (await nodes()).find(n => n.id === id);
      assert.ok(item, 'missing publish input: ' + id);
      const response = await author.request.post(base + '/api/admin/nodes/' + id + '/publish', {
        headers: { Origin: base }, data: { expectedRevision: item.revision },
      });
      assert.equal(response.status(), 200, await response.text());
    }
    async function hide(id) {
      const item = (await nodes()).find(n => n.id === id);
      const response = await author.request.post(base + '/api/admin/nodes/' + id + '/visibility', {
        headers: { Origin: base },
        data: { expectedRevision: item.revision, isPublic: false, publicSince: null },
      });
      assert.equal(response.status(), 200, await response.text());
    }
    const senses = entries => JSON.stringify(entries.map(([partOfSpeech, definition]) => ({
      id: randomUUID(), partOfSpeech, definition, etymologies: [],
    })));
    const series = await create('series', null, prefix + '-world');
    const classes = {wordClasses: JSON.stringify(['名詞', '動詞'].map(name => ({id: randomUUID(), name, description: ''})))};
    const languageA = await create('language', series, prefix + '-A', classes);
    const languageB = await create('language', series, prefix + '-B', classes);
    const wordAName = prefix + '-one';
    const wordBName = prefix + '-two';
    const wordCName = prefix + '-three';
    const wordA = await create('word', languageA, wordAName, {
      meanings: senses([['名詞', '海の意味'], ['動詞', '走る意味']]),
    });
    const wordB = await create('word', languageA, wordBName, {
      meanings: senses([['動詞', '火の意味']]),
    });
    const wordC = await create('word', languageB, wordCName, {
      meanings: senses([['名詞', '海の意味']]),
    });
    const hiddenName = prefix + '-secret';
    const hidden = await create('word', languageA, hiddenName, {
      meanings: senses([['名詞', '海の秘密']]),
    });
    const unpublishedName = prefix + '-unpublished';
    const unpublished = await create('word', languageA, unpublishedName, {
      meanings: senses([['名詞', '海の未公開']]),
    });
    const otherSeries = await create('series', null, prefix + '-other-world');
    const foreignLanguage = await create('language', otherSeries, prefix + '-other-language', classes);
    const foreignName = prefix + '-foreign';
    const foreign = await create('word', foreignLanguage, foreignName, {
      meanings: senses([['名詞', '海の意味']]),
    });
    for (const id of [series, languageA, languageB, wordA, wordB, wordC, hidden,
      otherSeries, foreignLanguage, foreign]) await publish(id);
    await hide(hidden);

    const treeResponse = await reader.request.get(base + '/api/public/series/' + series + '/tree');
    assert.equal(treeResponse.status(), 200);
    const publicIds = new Set((await treeResponse.json()).map(item => item.id));
    for (const id of [wordA, wordB, wordC]) assert.ok(publicIds.has(id), 'missing public word ' + id);
    for (const id of [hidden, unpublished, foreign]) {
      assert.equal(publicIds.has(id), false, 'leaked hidden, unpublished or other-series word: ' + id);
    }

    const page = await reader.newPage();
    await page.goto(base + '/dictionaries/' + series);
    const query = page.getByLabel('単語を検索');
    const language = page.getByLabel('言語');
    const part = page.getByLabel('品詞');
    const wordLink = name => page.getByRole('link', { name, exact: true });

    await query.fill('海の意味');
    await wordLink(wordCName).waitFor();
    assert.equal(await wordLink(wordAName).count(), 1, 'word A must match its first meaning');
    assert.equal(await wordLink(wordBName).count(), 0, 'word B has no matching meaning');
    assert.equal(await wordLink(wordCName).count(), 1, 'word C belongs to the second language');

    await part.selectOption('名詞');
    assert.equal(await wordLink(wordAName).count(), 1);
    assert.equal(await wordLink(wordCName).count(), 1);
    await language.selectOption(languageA);
    assert.equal(await wordLink(wordAName).count(), 1);
    assert.equal(await wordLink(wordCName).count(), 0, 'language filter must prevent cross-language results');
    assert.ok((await wordLink(wordAName).getAttribute('href'))?.endsWith('/items/' + wordA));

    await part.selectOption('動詞');
    assert.equal(await wordLink(wordAName).count(), 1,
      'multi-part-of-speech word stays in the filtered result as one word, even if the query matched another sense');
    await query.fill('火の意味');
    await wordLink(wordBName).waitFor();
    assert.equal(await wordLink(wordAName).count(), 0);
    assert.equal(await wordLink(wordBName).count(), 1);
    await part.selectOption('名詞');
    assert.equal(await wordLink(wordBName).count(), 0,
      'verb-only meaning is excluded by noun filter');

    await query.fill('海の意味');
    await language.selectOption(languageB);
    await wordLink(wordCName).waitFor();
    assert.equal(await wordLink(wordAName).count(), 0);
    assert.equal(await wordLink(wordCName).count(), 1);
    assert.ok((await wordLink(wordCName).getAttribute('href'))?.endsWith('/items/' + wordC));

    await language.selectOption('');
    await wordLink(wordAName).waitFor();
    assert.equal(await wordLink(wordAName).count(), 1);
    assert.equal(await wordLink(wordCName).count(), 1);
    const visible = await page.locator('body').innerText();
    for (const secret of [hiddenName, unpublishedName, foreignName, '海の秘密', '海の未公開']) {
      assert.ok(!visible.includes(secret), 'private, draft-only or other-series information leaked: ' + secret);
    }
    await page.close();
    await reader.close();
    await author.close();
  } finally {
    await browser.close();
  }
});
