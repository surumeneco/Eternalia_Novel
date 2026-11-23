/** SR-04/ST-09/LG-07/PB-03/PB-10: cross-series anonymous search boundaries.
 * Exploratory Chromium/PostgreSQL verification against disposable data.
 * No actual Discord OAuth, device switching, or formal CAT Gate assertion.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
const future = Date.parse('2099-11-12T00:00:00.000Z');

async function author(method, path, data) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Origin: base,
      'Content-Type': 'application/json',
      Cookie: 'eternalia_author=' + fixture.authorToken,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const body = await response.text();
  assert.ok(response.ok, method + ' ' + path + ' -> ' + response.status + ' ' + body);
  return JSON.parse(body);
}
async function create(kind, parentId, title, details = {}) {
  return (await author('POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: 'released:' + title, details },
  })).id;
}
async function current(id) {
  const node = (await author('GET', '/api/admin/nodes')).find(entry => entry.id === id);
  assert.ok(node, 'missing author node ' + id);
  return node;
}
async function publish(id) {
  const node = await current(id);
  await author('POST', '/api/admin/nodes/' + id + '/publish', {
    expectedRevision: node.revision,
  });
}
async function visibility(id, publicSince, isPublic = true) {
  const node = await current(id);
  await author('POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision: node.revision, isPublic, publicSince,
  });
}
async function publicTree(id) {
  const response = await fetch(base + '/api/public/series/' + id + '/tree');
  assert.equal(response.status, 200);
  return response.json();
}

async function selectAndSearch(page, { seriesId, seriesTitle, domain, term, expectedHrefs }) {
  const seriesSelect = page.locator('.search-filters select').first();
  if ((await seriesSelect.inputValue()) !== seriesId) {
    const treeResponse = page.waitForResponse(response =>
      response.url().includes('/api/public/series/' + seriesId + '/tree') && response.status() === 200);
    await seriesSelect.selectOption(seriesId);
    await treeResponse;
  }
  await page.locator('.search-filters select').nth(1).selectOption(domain);
  await page.locator('.search-filters input[type="search"]').fill(term);
  await page.waitForFunction(({ seriesTitle, expectedHrefs }) => {
    const status = document.querySelector('main [role="status"]');
    if (!status?.textContent?.includes(seriesTitle) ||
        !status.textContent.includes('：' + expectedHrefs.length)) return false;
    const hrefs = [...document.querySelectorAll('main .search-result a')]
      .map(anchor => anchor.getAttribute('href')).sort();
    return JSON.stringify(hrefs) === JSON.stringify([...expectedHrefs].sort());
  }, { seriesTitle, expectedHrefs }, { timeout: 20_000 });
  const actual = await page.locator('main .search-result a').evaluateAll(anchors =>
    anchors.map(anchor => anchor.getAttribute('href')).sort());
  assert.deepEqual(actual, [...expectedHrefs].sort());
}

test('SEARCH-ISOLATION-01/02/03: identical public tags and dictionary meanings never cross series, hidden ancestors disappear',
  { timeout: 180_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback HTTP only');
    const browser = await chromium.launch({ headless: true });
    const createdSeries = [];
    try {
      const stamp = fixture.prefix + '-cross-series-search-' + randomUUID().slice(0, 8);
      const tag = 'crossseries-' + randomUUID().slice(0, 16); // <= 50-character Tag contract
      const meaning = stamp + '-same-meaning';
      const seriesAName = stamp + '-series-A';
      const seriesBName = stamp + '-series-B';
      const seriesA = await create('series', null, seriesAName);
      const seriesB = await create('series', null, seriesBName);
      const seriesC = await create('series', null, stamp + '-private-C');
      createdSeries.push(seriesA, seriesB, seriesC);

      const items = [];
      for (const [seriesId, letter] of [[seriesA, 'A'], [seriesB, 'B'], [seriesC, 'C']]) {
        const category = await create('category', seriesId, stamp + '-category-' + letter);
        const language = await create('language', seriesId, stamp + '-language-' + letter);
        const tip = await create('tip', category, stamp + '-tip-' + letter, {
          tags: JSON.stringify([tag]), relatedTipIds: '[]',
        });
        const word = await create('word', language, stamp + '-word-' + letter, {
          meanings: JSON.stringify([{
            id: randomUUID(), partOfSpeechId: '', definition: meaning, etymologies: [],
          }]),
        });
        for (const id of [seriesId, category, language, tip, word]) await publish(id);
        items.push({ seriesId, category, language, tip, word, letter });
      }
      const [a, b, c] = items;
      const tipHref = item => '/series/' + item.seriesId + '/settings/' + item.category + '/' + item.tip;
      const wordHref = item => '/series/' + item.seriesId + '/dictionaries/' + item.language + '/words/' + item.word;
      // Private series C has the same token and published children but must
      // disappear from all anonymous choices and direct public tree lookups.
      await visibility(seriesC, null, false);
      const publicSeriesResponse = await fetch(base + '/api/public/series');
      assert.equal(publicSeriesResponse.status, 200);
      const publicIds = (await publicSeriesResponse.json()).map(node => node.id);
      assert.ok(publicIds.includes(seriesA));
      assert.ok(publicIds.includes(seriesB));
      assert.ok(!publicIds.includes(seriesC));
      assert.equal((await fetch(base + '/api/public/series/' + seriesC + '/tree')).status, 404);

      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        const page = await context.newPage();
        await page.goto(base + '/search?series=' + seriesA);
        await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
        const seriesSelect = page.locator('.search-filters select').first();
        await seriesSelect.locator('option[value="' + seriesA + '"]').waitFor({ state: 'attached' });
        assert.equal(await seriesSelect.locator('option[value="' + seriesC + '"]').count(), 0);
        await seriesSelect.selectOption(''); // Force fresh loading of the A tree.

        await selectAndSearch(page, {
          seriesId: seriesA, seriesTitle: seriesAName, domain: 'tips', term: tag,
          expectedHrefs: [tipHref(a)],
        });
        assert.ok(!(await page.locator('main').innerText()).includes(stamp + '-tip-B'));
        await selectAndSearch(page, {
          seriesId: seriesB, seriesTitle: seriesBName, domain: 'tips', term: tag,
          expectedHrefs: [tipHref(b)],
        });
        assert.ok(!(await page.locator('main').innerText()).includes(stamp + '-tip-A'));

        await selectAndSearch(page, {
          seriesId: seriesA, seriesTitle: seriesAName, domain: 'dictionaries', term: meaning,
          expectedHrefs: [wordHref(a)],
        });
        await selectAndSearch(page, {
          seriesId: seriesB, seriesTitle: seriesBName, domain: 'dictionaries', term: meaning,
          expectedHrefs: [wordHref(b)],
        });
        assert.ok(!(await page.locator('main').innerText()).includes(stamp + '-word-A'));

        // B's Word remains marked published while its parent Language is scheduled.
        await visibility(b.language, future);
        const scheduledTree = await publicTree(seriesB);
        assert.ok(!scheduledTree.some(node => node.id === b.word));
        assert.equal((await fetch(base + '/api/public/items/' + b.word)).status, 404);
        await selectAndSearch(page, {
          seriesId: seriesA, seriesTitle: seriesAName, domain: 'dictionaries', term: meaning,
          expectedHrefs: [wordHref(a)],
        });
        await selectAndSearch(page, {
          seriesId: seriesB, seriesTitle: seriesBName, domain: 'dictionaries', term: meaning,
          expectedHrefs: [],
        });
        const visibleSearch = await page.locator('main').innerText();
        assert.ok(!visibleSearch.includes(stamp + '-word-B'));
        assert.ok(!visibleSearch.includes(meaning));
        assert.equal(await page.locator('main .search-result a[href="' + wordHref(b) + '"]').count(), 0);
        await page.close();
      } finally { await context.close(); }
    } finally {
      for (const id of createdSeries) {
        try { await visibility(id, null, false); } catch { /* disposable DB cleanup */ }
      }
      await browser.close();
    }
  });
