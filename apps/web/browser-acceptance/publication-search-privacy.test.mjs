/** PB-05/PB-10/AC-31/54/55/70: actual anonymous search after publication schedule changes. */
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
  const text = await response.text();
  return {
    status: response.status,
    text,
    value: () => JSON.parse(text),
  };
}
async function current(id) {
  const response = await author('GET', '/api/admin/nodes');
  assert.equal(response.status, 200, response.text);
  const node = response.value().find(entry => entry.id === id);
  assert.ok(node, 'missing author node ' + id);
  return node;
}
async function create(kind, parentId, title) {
  const response = await author('POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: 'published:' + title, details: {} },
  });
  assert.equal(response.status, 201, response.text);
  return response.value().id;
}
async function publish(id) {
  const node = await current(id);
  const response = await author('POST', '/api/admin/nodes/' + id + '/publish', {
    expectedRevision: node.revision,
  });
  assert.equal(response.status, 200, response.text);
}
async function visibility(id, publicSince, isPublic = true) {
  const node = await current(id);
  const response = await author('POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision: node.revision, isPublic, publicSince,
  });
  assert.equal(response.status, 200, response.text);
}
async function readPublicTree(id) {
  const response = await fetch(base + '/api/public/series/' + id + '/tree');
  assert.equal(response.status, 200);
  return response.json();
}

test('PUB-SEARCH-01/02/03: scheduled item and scheduled ancestor stay out of anonymous search',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      const seriesTitle = fixture.prefix + '-search-privacy-world';
      const tipTitle = fixture.prefix + '-search-privacy-setting';
      seriesId = await create('series', null, seriesTitle);
      const categoryId = await create('category', seriesId, fixture.prefix + '-search-privacy-category');
      const tipId = await create('tip', categoryId, tipTitle);
      for (const id of [seriesId, categoryId, tipId]) await publish(id);
      assert.ok((await readPublicTree(seriesId)).some(node => node.id === tipId));

      // Each stage uses a fresh anonymous browser page: no author cookie or stale
      // Nuxt client-side store is allowed to prove a reader privacy boundary.
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      async function openSearch() {
        const page = await context.newPage();
        await page.goto(base + '/search?series=' + seriesId);
        await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
        const seriesSelect = page.locator('.search-filters select').first();
        await seriesSelect.waitFor();
        return { page, seriesSelect };
      }
      async function readSearch(visible) {
        const { page, seriesSelect } = await openSearch();
        try {
          await seriesSelect.locator('option[value="' + seriesId + '"]').waitFor({ state: 'attached' });
          // openSearch already waits for Vue hydration; do not toggle and
          // persist an unrelated UI-language cookie across reader pages.
          await seriesSelect.selectOption('');
          await seriesSelect.selectOption(seriesId);
          await page.locator('.search-filters input[type="search"]').fill(tipTitle);
          await page.getByRole('status').filter({ hasText: seriesTitle }).waitFor();
          await page.waitForFunction(
            ({ expected, title }) => {
              const status = document.querySelector('main [role="status"]');
              const results = [...document.querySelectorAll('main .search-result a')];
              return status?.textContent?.includes(expected ? '：1' : '：0')
                && (expected ? results.some(link => link.textContent === title) : results.length === 0);
            },
            { expected: visible, title: tipTitle },
            { timeout: 20_000 },
          );
          const titles = await page.locator('.search-result a').allTextContents();
          assert.equal(titles.includes(tipTitle), visible);
          if (visible) {
            assert.ok((await page.locator('.search-result').innerText()).includes('published:' + tipTitle));
          } else {
            assert.ok(!(await page.locator('main').innerText()).includes('published:' + tipTitle),
              'scheduled draft/content must not appear in search results');
          }
        } finally {
          await page.close();
        }
      }
      await readSearch(true);

      await visibility(tipId, future);
      assert.ok(!(await readPublicTree(seriesId)).some(node => node.id === tipId));
      await readSearch(false);

      await visibility(tipId, null);
      assert.ok((await readPublicTree(seriesId)).some(node => node.id === tipId));
      await readSearch(true);

      // The published leaf remains flagged public, but its unpublished ancestor
      // removes the series choice itself from an anonymous search.
      await visibility(seriesId, future);
      const response = await fetch(base + '/api/public/series');
      assert.equal(response.status, 200);
      assert.ok(!(await response.json()).some(node => node.id === seriesId));
      const { page, seriesSelect } = await openSearch();
      try {
        assert.equal(await seriesSelect.locator('option[value="' + seriesId + '"]').count(), 0);
        assert.ok(!(await page.locator('main').innerText()).includes(tipTitle));
        assert.ok(!(await page.locator('main').innerText()).includes(seriesTitle));
      } finally {
        await page.close();
      }
      await context.close();
    } finally {
      // This is an isolated disposable DB; leave the extra test series hidden.
      if (seriesId) {
        try { await visibility(seriesId, null, false); } catch { /* preserve original failure */ }
      }
      await browser.close();
    }
  });
