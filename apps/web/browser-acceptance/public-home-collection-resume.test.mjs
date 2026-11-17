/** Public home and all four collection pages must discard previously public
 * nodes at lifecycle resume. Synthetic visibility events in headless Chromium
 * and disposable real PostgreSQL; not real device tab/actual BFCache evidence.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
const future = Date.parse('2099-11-15T01:15:00.000Z');

async function author(method, path, data) {
  const response = await fetch(base + path, {
    method, headers: {
      Origin: base, 'Content-Type': 'application/json',
      Cookie: 'eternalia_author=' + fixture.authorToken,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const body = await response.text();
  assert.ok(response.ok, method + ' ' + path + ': ' + response.status + ' ' + body);
  return JSON.parse(body);
}
async function create(kind, parentId, title) {
  return (await author('POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: 'reader-content:' + title, details: {} },
  })).id;
}
async function current(id) {
  const result = (await author('GET', '/api/admin/nodes')).find(node => node.id === id);
  assert.ok(result, 'missing author node ' + id);
  return result;
}
async function publish(id) {
  await author('POST', '/api/admin/nodes/' + id + '/publish', { expectedRevision: (await current(id)).revision });
}
async function visibility(id, publicSince, isPublic = true) {
  await author('POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision: (await current(id)).revision, publicSince, isPublic,
  });
}
async function simulateVisibility(page, state) {
  await page.evaluate(value => {
    Object.defineProperty(document, 'visibilityState', { value, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}
async function pageAt(context, path, marker) {
  const page = await context.newPage();
  const response = await page.goto(base + path);
  assert.equal(response?.status(), 200);
  await page.getByRole('link', { name: marker, exact: true }).first().waitFor();
  await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
  return page;
}
async function assertNoMarker(page, marker) {
  await page.waitForFunction(text => !document.querySelector('main')?.textContent?.includes(text),
    marker, { polling: 100, timeout: 5000 });
  assert.ok(!(await page.locator('main').innerText()).includes(marker), 'old series/link must not survive');
}

test('PUB-LIST-RESUME-01/02/04: home series and recent vanish, restore, and fail closed on BFCache-style 503',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'), 'loopback disposable database only');
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      const marker = fixture.prefix + '-home-resume';
      seriesId = await create('series', null, marker + '-WORLD');
      const category = await create('category', seriesId, marker + '-CATEGORY');
      const tip = await create('tip', category, marker + '-RECENT-TIP');
      for (const id of [seriesId, category, tip]) await publish(id);
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        const page = await pageAt(context, '/', marker + '-WORLD');
        await page.getByRole('link', { name: marker + '-RECENT-TIP', exact: true }).waitFor();
        await simulateVisibility(page, 'hidden');
        await assertNoMarker(page, marker);
        await visibility(seriesId, future);
        const publicSeries = await context.request.get(base + '/api/public/series');
        assert.ok(!(await publicSeries.json()).some(node => node.id === seriesId));
        const seriesResponse = page.waitForResponse(r => r.url().endsWith('/api/public/series') && r.status() === 200);
        const recentResponse = page.waitForResponse(r => r.url().endsWith('/api/public/recent') && r.status() === 200);
        await simulateVisibility(page, 'visible');
        await Promise.all([seriesResponse, recentResponse]);
        await assertNoMarker(page, marker);

        await simulateVisibility(page, 'hidden');
        await visibility(seriesId, null);
        const restored = page.waitForResponse(r => r.url().endsWith('/api/public/series') && r.status() === 200);
        await simulateVisibility(page, 'visible');
        await restored;
        await page.locator('main ul.reader-list').getByRole('link', { name: marker + '-WORLD', exact: true }).waitFor();
        await page.getByRole('link', { name: marker + '-RECENT-TIP', exact: true }).waitFor();

        // BFCache-style pageshow with failing public series response must not
        // revive the old series data. The author has just hidden the series.
        await visibility(seriesId, future);
        await page.route('**/api/public/series', async route => {
          await route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"offline"}' });
        });
        const failure = page.waitForResponse(r => r.url().endsWith('/api/public/series') && r.status() === 503);
        await page.evaluate(() =>
          window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
        await failure;
        await page.locator('main [role="alert"]').waitFor();
        await assertNoMarker(page, marker);
        await page.unroute('**/api/public/series');
        await page.close();
      } finally { await context.close(); }
    } finally {
      if (seriesId) { try { await visibility(seriesId, null, false); } catch { /* keep test failure */ } }
      await browser.close();
    }
  });

test('PUB-LIST-RESUME-03: all four shared public collections clear a hidden series before revalidation',
  { timeout: 120_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      const title = fixture.prefix + '-collection-resume-WORLD';
      seriesId = await create('series', null, title);
      await publish(seriesId);
      const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
      try {
        for (const domain of ['stories', 'tips', 'dictionaries', 'timeline']) {
          await visibility(seriesId, null);
          const page = await pageAt(context, '/' + domain, title);
          try {
            await simulateVisibility(page, 'hidden');
            await assertNoMarker(page, title);
            await visibility(seriesId, future);
            const fresh = await context.request.get(base + '/api/public/series');
            assert.ok(!(await fresh.json()).some(node => node.id === seriesId));
            const response = page.waitForResponse(r =>
              r.url().endsWith('/api/public/series') && r.status() === 200);
            await simulateVisibility(page, 'visible');
            await response;
            await assertNoMarker(page, title);
          } finally { await page.close(); }
        }
      } finally { await context.close(); }
    } finally {
      if (seriesId) { try { await visibility(seriesId, null, false); } catch { /* keep test failure */ } }
      await browser.close();
    }
  });
