/** Anonymous reader detail revalidation on tab resume.
 * Real disposable Nest/Nuxt/PostgreSQL with synthetic author cookie.
 * visibilitychange/pageshow events are simulated in headless Chromium; NOT an
 * actual device/BFCache lifecycle or instant revocation in a foreground tab.
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
async function byId(id) {
  const result = (await author('GET', '/api/admin/nodes')).find(node => node.id === id);
  assert.ok(result, 'missing author node ' + id);
  return result;
}
async function publish(id) {
  await author('POST', '/api/admin/nodes/' + id + '/publish', {
    expectedRevision: (await byId(id)).revision,
  });
}
async function visibility(id, publicSince, isPublic = true) {
  await author('POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision: (await byId(id)).revision, publicSince, isPublic,
  });
}
async function simulateVisibility(page, state) {
  await page.evaluate(value => {
    Object.defineProperty(document, 'visibilityState', {
      value, configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}
async function readerPage(browser, path, title) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(base + path);
  assert.equal(response?.status(), 200);
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
  await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
  assert.ok((await page.locator('main').innerText()).includes('reader-content:' + title));
  return { page, context };
}
async function assertNoBody(page, title) {
  await page.waitForFunction(secret =>
    !document.querySelector('main')?.textContent?.includes(secret),
    'reader-content:' + title, { timeout: 5000, polling: 100 });
  assert.ok(!(await page.locator('main').innerText()).includes('reader-content:' + title));
}

test('PUB-DETAIL-RESUME-01/02: generic Tip detail clears on hidden, rejects revoked ancestor and restores after republish',
  { timeout: 90_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      const marker = fixture.prefix + '-reader-resume-tip';
      seriesId = await create('series', null, marker + '-world');
      const categoryId = await create('category', seriesId, marker + '-category');
      const tipId = await create('tip', categoryId, marker + '-SECRET-TITLE');
      for (const id of [seriesId, categoryId, tipId]) await publish(id);
      const { page, context } = await readerPage(browser, '/items/' + tipId, marker + '-SECRET-TITLE');
      try {
        await simulateVisibility(page, 'hidden');
        await assertNoBody(page, marker + '-SECRET-TITLE');
        await visibility(categoryId, future);
        const denied = await context.request.get(base + '/api/public/items/' + tipId);
        assert.equal(denied.status(), 404, 'real API must reject hidden ancestor');
        const revokeFetch = page.waitForResponse(r =>
          r.url().endsWith('/api/public/items/' + tipId) && r.status() === 404);
        await simulateVisibility(page, 'visible');
        await revokeFetch;
        await page.locator('main [role="alert"]').waitFor();
        assert.ok(!(await page.locator('main').innerText()).includes(marker + '-SECRET-TITLE'));
        assert.ok(!(await page.locator('.topic-path').innerText()).includes(marker + '-SECRET-TITLE'),
          'cached breadcrumb must not expose unpublished title');

        await simulateVisibility(page, 'hidden');
        await visibility(categoryId, null);
        const restoreFetch = page.waitForResponse(r =>
          r.url().endsWith('/api/public/items/' + tipId) && r.status() === 200);
        await simulateVisibility(page, 'visible');
        await restoreFetch;
        await page.getByRole('heading', { name: marker + '-SECRET-TITLE' }).waitFor();
        assert.ok((await page.locator('.rich-body').innerText()).includes('reader-content:' + marker));
      } finally { await context.close(); }
    } finally {
      if (seriesId) { try { await visibility(seriesId, null, false); } catch { /* preserve failure */ } }
      await browser.close();
    }
  });

test('PUB-DETAIL-RESUME-03: chapter body and predecessor/successor disappear when its ancestor is hidden',
  { timeout: 90_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      const marker = fixture.prefix + '-reader-resume-chapter';
      seriesId = await create('series', null, marker + '-world');
      const volumeId = await create('volume', seriesId, marker + '-volume');
      const partId = await create('part', volumeId, marker + '-part');
      const chapterId = await create('chapter', partId, marker + '-SECRET-CHAPTER');
      for (const id of [seriesId, volumeId, partId, chapterId]) await publish(id);
      const { page, context } = await readerPage(browser, '/read/' + chapterId, marker + '-SECRET-CHAPTER');
      try {
        await simulateVisibility(page, 'hidden');
        await assertNoBody(page, marker + '-SECRET-CHAPTER');
        await visibility(partId, future);
        assert.equal((await context.request.get(base + '/api/public/items/' + chapterId)).status(), 404);
        const denied = page.waitForResponse(r =>
          r.url().endsWith('/api/public/items/' + chapterId) && r.status() === 404);
        await simulateVisibility(page, 'visible');
        await denied;
        await page.locator('main [role="alert"]').waitFor();
        assert.ok(!(await page.locator('main').innerText()).includes(marker + '-SECRET-CHAPTER'));
        assert.equal(await page.locator('.chapter-navigation').count(), 0);
      } finally { await context.close(); }
    } finally {
      if (seriesId) { try { await visibility(seriesId, null, false); } catch { /* keep failure */ } }
      await browser.close();
    }
  });

test('PUB-DETAIL-RESUME-04: BFCache-style pageshow cannot revive stale detail after 503 revalidation failure',
  { timeout: 90_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      const marker = fixture.prefix + '-reader-resume-bfcache';
      seriesId = await create('series', null, marker + '-world');
      const categoryId = await create('category', seriesId, marker + '-category');
      const tipId = await create('tip', categoryId, marker + '-SECRET-TITLE');
      for (const id of [seriesId, categoryId, tipId]) await publish(id);
      const { page, context } = await readerPage(browser, '/items/' + tipId, marker + '-SECRET-TITLE');
      try {
        await visibility(categoryId, future);
        await page.route('**/api/public/items/' + tipId, async route => {
          await route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"unavailable"}' });
        });
        const failure = page.waitForResponse(r =>
          r.url().endsWith('/api/public/items/' + tipId) && r.status() === 503);
        await page.evaluate(() =>
          window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
        await failure;
        await page.locator('main [role="alert"]').waitFor();
        assert.ok(!(await page.locator('main').innerText()).includes(marker + '-SECRET-TITLE'));
        await page.unroute('**/api/public/items/' + tipId);
      } finally { await context.close(); }
    } finally {
      if (seriesId) { try { await visibility(seriesId, null, false); } catch { /* keep failure */ } }
      await browser.close();
    }
  });
