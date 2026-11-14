/** PB-03/05/10/11: browser lifecycle invalidates previously published reader detail.
 * Synthetic visibility events are used because headless Chromium does not
 * reliably hide inactive tabs. This is not real-device/tab lifecycle proof.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
const future = Date.parse('2099-12-10T06:00:00.000Z');

async function author(method, path, data) {
  const res = await fetch(base + path, {
    method,
    headers: {
      Origin: base,
      'Content-Type': 'application/json',
      Cookie: 'eternalia_author=' + fixture.authorToken,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const text = await res.text();
  assert.ok(res.ok, method + ' ' + path + ' -> ' + res.status + ' ' + text);
  return JSON.parse(text);
}
async function create(kind, parentId, title) {
  return (await author('POST', '/api/admin/nodes', {
    kind, parentId, content: {
      title, body: 'PUBLIC-BODY:' + title, details: {},
    },
  })).id;
}
async function current(id) {
  const found = (await author('GET', '/api/admin/nodes')).find(n => n.id === id);
  assert.ok(found, 'missing author node ' + id);
  return found;
}
async function publish(id) {
  const n = await current(id);
  await author('POST', '/api/admin/nodes/' + id + '/publish', { expectedRevision: n.revision });
}
async function visibility(id, publicSince, isPublic = true) {
  const n = await current(id);
  await author('POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision: n.revision, isPublic, publicSince,
  });
}
async function lifecycle(page, state) {
  await page.evaluate(value => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true, value,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}
async function hydrated(page) {
  await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
}

test('READER-RESUME-01/02/03/04: item, chapter and series readers drop revoked published data and recover after re-publication',
  { timeout: 180_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback fixture only');
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      const marker = fixture.prefix + '-reader-resume-';
      seriesId = await create('series', null, marker + 'series');
      const category = await create('category', seriesId, marker + 'category');
      const tip = await create('tip', category, marker + 'TIP-SECRET');
      const volume = await create('volume', seriesId, marker + 'volume');
      const part = await create('part', volume, marker + 'part');
      const chapter = await create('chapter', part, marker + 'CHAPTER-SECRET');
      for (const id of [seriesId, category, tip, volume, part, chapter]) await publish(id);
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        const cases = [
          { path: '/items/' + tip, node: category, title: marker + 'TIP-SECRET',
            response: '/api/public/items/' + tip },
          { path: '/read/' + chapter, node: part, title: marker + 'CHAPTER-SECRET',
            response: '/api/public/items/' + chapter },
          { path: '/series/' + seriesId, node: seriesId, title: marker + 'series',
            response: '/api/public/series/' + seriesId + '/tree' },
        ];
        for (const scenario of cases) {
          const page = await context.newPage();
          try {
            await page.goto(base + scenario.path);
            await page.getByRole('heading', { name: scenario.title, exact: true }).waitFor();
            await hydrated(page);
            assert.ok((await page.locator('main').innerText()).includes(scenario.title));
            await lifecycle(page, 'hidden');
            await visibility(scenario.node, future);
            const unavailable = page.waitForResponse(r =>
              r.url().endsWith(scenario.response) && r.status() === 404);
            await lifecycle(page, 'visible');
            await unavailable;
            await page.locator('main [role="alert"]').waitFor();
            assert.ok(!(await page.locator('main').innerText()).includes(scenario.title),
              'revoked title remains in ' + scenario.path);
            assert.ok(!(await page.locator('main').innerText()).includes('PUBLIC-BODY:' + scenario.title),
              'revoked body remains in ' + scenario.path);
            assert.equal(await page.locator('main .chapter-navigation').count(), 0,
              'chapter navigation must not outlive revoked ancestor');

            await lifecycle(page, 'hidden');
            await visibility(scenario.node, null);
            const republished = page.waitForResponse(r =>
              r.url().endsWith(scenario.response) && r.status() === 200);
            await lifecycle(page, 'visible');
            await republished;
            await page.getByRole('heading', { name: scenario.title, exact: true }).waitFor();
            assert.ok((await page.locator('main').innerText()).includes(scenario.title),
              'freshly re-published content not restored at ' + scenario.path);
          } finally { await page.close(); }
        }
      } finally { await context.close(); }
    } finally {
      if (seriesId) {
        try { await visibility(seriesId, null, false); }
        catch { /* disposable DB; original failure wins */ }
      }
      await browser.close();
    }
  });

test('READER-RESUME-04: BFCache-style item restore with 503 cannot show the previous published body',
  { timeout: 90_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      seriesId = await create('series', null, fixture.prefix + '-bfcache-detail-series');
      const category = await create('category', seriesId, fixture.prefix + '-bfcache-detail-category');
      const title = fixture.prefix + '-bfcache-DETAIL-SECRET';
      const tipId = await create('tip', category, title);
      for (const id of [seriesId, category, tipId]) await publish(id);
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await page.goto(base + '/items/' + tipId);
        await page.getByRole('heading', { name: title, exact: true }).waitFor();
        await hydrated(page);
        await visibility(category, future);
        await page.route('**/api/public/items/' + tipId, route =>
          route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"temporarily unavailable"}' }));
        const request = page.waitForResponse(r =>
          r.url().endsWith('/api/public/items/' + tipId) && r.status() === 503);
        await page.evaluate(() => window.dispatchEvent(
          new PageTransitionEvent('pageshow', { persisted: true })));
        await request;
        await page.locator('main [role="alert"]').waitFor();
        assert.ok(!(await page.locator('main').innerText()).includes(title),
          'failed revalidation resurrected stale published title');
        assert.equal(await page.locator('main .reader-details').count(), 0);
        await context.close();
      } catch (err) { await context.close(); throw err; }
    } finally {
      if (seriesId) {
        try { await visibility(seriesId, null, false); } catch {}
      }
      await browser.close();
    }
  });
