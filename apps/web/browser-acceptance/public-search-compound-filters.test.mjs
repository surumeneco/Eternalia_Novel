/** ST-09/LG-07/PB-10: exploratory compound filter/sort and effective-publication search isolation. */
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
  const result = await author('POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: 'published:' + title, details },
  });
  return result.id;
}
async function current(id) {
  const node = (await author('GET', '/api/admin/nodes')).find(item => item.id === id);
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

async function switchSeries(page, id, reload = false) {
  const select = page.locator('.search-filters select').first();
  if (reload || (await select.inputValue()) === id) await select.selectOption('');
  const tree = page.waitForResponse(response =>
    response.url().includes('/api/public/series/' + id + '/tree') && response.status() === 200);
  await select.selectOption(id);
  await tree;
}

/** Assert exact result IDs and order, not just count or the absence of a token. */
async function search(page, seriesName, domain, term, sort, expectedHrefs) {
  await page.locator('.search-filters select').nth(1).selectOption(domain);
  await page.locator('.search-filters select').nth(2).selectOption(sort);
  await page.locator('.search-filters input[type="search"]').fill(term);
  await page.waitForFunction(({ seriesName, expectedHrefs }) => {
    const main = document.querySelector('main.site-main');
    const status = main?.querySelector('[role="status"]');
    const actual = [...(main?.querySelectorAll('.search-result a') ?? [])]
      .map(el => el.getAttribute('href'));
    return status?.textContent?.includes(seriesName) &&
      status.textContent.includes('：' + expectedHrefs.length) &&
      JSON.stringify(actual) === JSON.stringify(expectedHrefs);
  }, { seriesName, expectedHrefs }, { timeout: 20_000 });
  const links = await page.locator('main.site-main .search-result a').evaluateAll(els =>
    els.map(el => el.getAttribute('href')));
  assert.deepEqual(links, expectedHrefs, domain + '/' + sort + '/' + term);
}

test('SEARCH-COMPOUND-01/02/03: series × domain × term × sort remain isolated after ancestor scheduling',
  { timeout: 240_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable HTTP acceptance only');
    const browser = await chromium.launch({ headless: true });
    const createdSeries = [];
    try {
      const stamp = fixture.prefix + '-compound-' + randomUUID().slice(0, 8);
      const token = 'compound-' + randomUUID().slice(0, 16);
      const seriesAName = stamp + '-A';
      const seriesBName = stamp + '-B';
      const seriesA = await create('series', null, seriesAName);
      const seriesB = await create('series', null, seriesBName);
      createdSeries.push(seriesA, seriesB);
      const tagMaster = await author('POST','/api/admin/masters/tags',{
        group:stamp,name:token,order:0,
      });
      const categoryA = await create('category', seriesA, stamp + '-category-A');
      const languageA = await create('language', seriesA, stamp + '-language-A');
      const tipZ = await create('tip', categoryA, 'Zeta-' + token, {
        tagIds: JSON.stringify([tagMaster.id]), relatedTipIds: '[]',
      });
      const tipA = await create('tip', categoryA, 'Alpha-' + token, {
        tagIds: JSON.stringify([tagMaster.id]), relatedTipIds: '[]',
      });
      const wordA = await create('word', languageA, stamp + '-word', {
        meanings: JSON.stringify([{
          id: randomUUID(), partOfSpeechId: '', definition: 'definition-' + token, etymologies: [],
        }]),
      });
      const categoryB = await create('category', seriesB, stamp + '-category-B');
      const tipB = await create('tip', categoryB, 'Other-' + token, {
        tagIds: JSON.stringify([tagMaster.id]), relatedTipIds: '[]',
      });
      for (const id of [seriesA, seriesB, categoryA, languageA, categoryB, tipZ, tipA, wordA, tipB]) {
        await publish(id);
      }
      const aTree = await publicTree(seriesA);
      const zNode = aTree.find(item => item.id === tipZ);
      const aNode = aTree.find(item => item.id === tipA);
      const wordNode = aTree.find(item => item.id === wordA);
      assert.ok(zNode && aNode && wordNode);
      assert.ok(zNode.order < aNode.order, 'manual sibling order follows initial Z→A creation');
      const recentTips = [zNode, aNode]
        .sort((a, b) => b.publishedAt - a.publishedAt || a.id.localeCompare(b.id))
        .map(node => '/items/' + node.id);

      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        const page = await context.newPage();
        const response = await page.goto(base + '/search?series=' + seriesA);
        assert.equal(response?.status(), 200);
        await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
        await page.locator('.search-filters select').first()
          .locator('option[value="' + seriesA + '"]').waitFor({ state: 'attached' });
        await switchSeries(page, seriesA);

        // Same term in tags and dictionary meanings must respect domain AND series.
        await search(page, seriesAName, 'tips', token, 'manual',
          ['/items/' + tipZ, '/items/' + tipA]);
        await search(page, seriesAName, 'tips', token, 'title',
          ['/items/' + tipA, '/items/' + tipZ]);
        await search(page, seriesAName, 'tips', token, 'recent', recentTips);
        await search(page, seriesAName, 'dictionaries', token, 'title',
          ['/items/' + wordA]);
        await search(page, seriesAName, 'stories', token, 'manual', []);
        await search(page, seriesAName, 'all', token, 'title',
          ['/items/' + tipA, '/items/' + tipZ, '/items/' + wordA]
            .sort((x, y) => {
              const name = new Map([
                ['/items/' + tipA, aNode.content.title],
                ['/items/' + tipZ, zNode.content.title],
                ['/items/' + wordA, wordNode.content.title],
              ]);
              return name.get(x).localeCompare(name.get(y), 'ja');
            }));
        assert.equal(await page.locator('main a[href="/items/' + tipB + '"]').count(), 0);

        await switchSeries(page, seriesB);
        await search(page, seriesBName, 'all', token, 'manual', ['/items/' + tipB]);
        assert.equal(await page.locator('main a[href="/items/' + tipA + '"]').count(), 0);

        // A's ancestor becomes future-scheduled; a word under another parent stays public.
        await visibility(categoryA, future);
        const hiddenTree = await publicTree(seriesA);
        assert.ok(!hiddenTree.some(node => node.id === tipA || node.id === tipZ));
        assert.ok(hiddenTree.some(node => node.id === wordA));
        for (const id of [tipA, tipZ]) {
          assert.equal((await fetch(base + '/api/public/items/' + id)).status, 404);
        }
        await switchSeries(page, seriesA);
        await search(page, seriesAName, 'tips', token, 'manual', []);
        await search(page, seriesAName, 'all', token, 'manual', ['/items/' + wordA]);
        const visibleText = await page.locator('main.site-main').innerText();
        assert.ok(!visibleText.includes('Alpha-' + token));
        assert.ok(!visibleText.includes('Zeta-' + token));
        await switchSeries(page, seriesB);
        await search(page, seriesBName, 'tips', token, 'manual', ['/items/' + tipB]);
        await page.close();
      } finally { await context.close(); }
    } finally {
      for (const id of createdSeries) {
        try { await visibility(id, null, false); } catch { /* disposable DB cleanup */ }
      }
      await browser.close();
    }
  });
