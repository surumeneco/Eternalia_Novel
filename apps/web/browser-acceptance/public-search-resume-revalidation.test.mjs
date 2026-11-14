/** PB-03/PB-05/PB-10: stale public search must be revalidated on tab resume.
 * Browser/HTTP acceptance with synthetic author session and disposable PostgreSQL.
 * Does not test actual Discord OAuth, physical devices or instantaneous revocation
 * in a continuously foregrounded tab.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
const future = Date.parse('2099-07-08T00:15:00.000Z');

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
async function create(kind, parentId, title) {
  return (await author('POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: 'public:' + title, details: {} },
  })).id;
}
async function current(id) {
  return (await author('GET', '/api/admin/nodes')).find(item => item.id === id);
}
async function publish(id) {
  const node = await current(id);
  assert.ok(node, 'no author node ' + id);
  await author('POST', '/api/admin/nodes/' + id + '/publish', {
    expectedRevision: node.revision,
  });
}
async function visibility(id, publicSince, isPublic = true) {
  const node = await current(id);
  assert.ok(node);
  await author('POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision: node.revision, publicSince, isPublic,
  });
}
async function openSearch(browser, seriesId, tipTitle) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(base + '/search?series=' + seriesId);
  await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
  const series = page.locator('.search-filters select').first();
  await series.locator('option[value="' + seriesId + '"]').waitFor({ state: 'attached' });
  await series.selectOption('');
  await series.selectOption(seriesId);
  await page.locator('.search-filters select').nth(1).selectOption('tips');
  await page.locator('.search-filters input[type="search"]').fill(tipTitle);
  await page.locator('.search-result a').filter({ hasText: tipTitle }).waitFor();
  return { context, page, series };
}

test('PUB-RESUME-01/02: a hidden anonymous search tab revalidates ancestor visibility and restores published results',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback only');
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      const suffix = fixture.prefix + '-resume-search-';
      const tipTitle = suffix + 'private-when-hidden';
      seriesId = await create('series', null, suffix + 'series');
      const categoryId = await create('category', seriesId, suffix + 'category');
      const tipId = await create('tip', categoryId, tipTitle);
      for (const id of [seriesId, categoryId, tipId]) await publish(id);
      const { context, page, series } = await openSearch(browser, seriesId, tipTitle);
      try {
        const secondTab = await context.newPage();
        await secondTab.goto(base + '/');
        await secondTab.bringToFront();
        await page.waitForFunction(() => document.visibilityState === 'hidden');
        await visibility(categoryId, future);
        const fresh = await context.request.get(base + '/api/public/series/' + seriesId + '/tree');
        assert.equal(fresh.status(), 200);
        assert.ok(!(await fresh.json()).some(item => item.id === tipId),
          'server must hide scheduled descendants before browser revalidation');

        const nextTree = page.waitForResponse(response =>
          response.url().includes('/api/public/series/' + seriesId + '/tree') && response.status() === 200);
        await page.bringToFront();
        await nextTree;
        await page.waitForFunction(() =>
          document.visibilityState === 'visible' &&
          document.querySelectorAll('.search-result').length === 0 &&
          !document.querySelector('main')?.textContent?.includes('public:' + document.querySelector('main input[type=search]')?.value)
        );
        assert.equal(await page.locator('main .search-result').count(), 0);
        assert.ok(!(await page.locator('main').innerText()).includes(tipTitle),
          'no title or body of revoked published item may survive tab resume');
        assert.equal(await series.inputValue(), seriesId);
        assert.equal(await page.locator('.search-filters select').nth(1).inputValue(), 'tips');
        assert.equal(await page.locator('.search-filters input[type=search]').inputValue(), tipTitle);

        // Re-publication in another tab is reflected without navigating
        // away from the reader's filtered search form.
        await secondTab.bringToFront();
        await page.waitForFunction(() => document.visibilityState === 'hidden');
        await visibility(categoryId, null);
        const restoredTree = page.waitForResponse(response =>
          response.url().includes('/api/public/series/' + seriesId + '/tree') && response.status() === 200);
        await page.bringToFront();
        await restoredTree;
        await page.locator('main .search-result a').filter({ hasText: tipTitle }).waitFor();
        assert.equal(await page.locator('main .search-result a').count(), 1);
        assert.equal(await page.locator('main .search-result a').getAttribute('href'), '/items/' + tipId);
        assert.equal(await page.locator('.search-filters input[type=search]').inputValue(), tipTitle);
        await secondTab.close();
      } finally { await context.close(); }
    } finally {
      if (seriesId) {
        try { await visibility(seriesId, null, false); } catch { /* keep original error */ }
      }
      await browser.close();
    }
  });

test('PUB-RESUME-03/04: BFCache-style pageshow hides old results and failed refetch cannot revive them',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      const title = fixture.prefix + '-resume-bfcache-secret';
      seriesId = await create('series', null, fixture.prefix + '-resume-bfcache-series');
      const categoryId = await create('category', seriesId, fixture.prefix + '-resume-bfcache-category');
      const tipId = await create('tip', categoryId, title);
      for (const id of [seriesId, categoryId, tipId]) await publish(id);
      const { context, page } = await openSearch(browser, seriesId, title);
      try {
        // The author changes the real DB while the reader's open tab retains
        // its previous published result. Failed revalidation must fail closed.
        await visibility(categoryId, future);
        await page.route('**/api/public/series/' + seriesId + '/tree', async route => {
          await route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"revalidation unavailable"}' });
        });
        const failedTree = page.waitForResponse(response =>
          response.url().includes('/api/public/series/' + seriesId + '/tree') && response.status() === 503);
        await page.evaluate(() =>
          window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
        await failedTree;
        await page.locator('main [role="alert"]').waitFor();
        assert.equal(await page.locator('main .search-result').count(), 0);
        assert.ok(!(await page.locator('main').innerText()).includes(title),
          'stale sensitive content may not appear as fallback after failed refresh');
        await page.unroute('**/api/public/series/' + seriesId + '/tree');
      } finally { await context.close(); }
    } finally {
      if (seriesId) {
        try { await visibility(seriesId, null, false); } catch { /* keep original error */ }
      }
      await browser.close();
    }
  });
