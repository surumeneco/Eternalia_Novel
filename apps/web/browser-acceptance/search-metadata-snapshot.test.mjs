/** ST-04/ST-09/LG-07/PB-10: search indexed metadata must use public snapshots. */
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
  const responseText = await response.text();
  assert.ok(response.status >= 200 && response.status < 300,
    method + ' ' + path + ' -> ' + response.status + ' ' + responseText);
  return JSON.parse(responseText);
}
async function current(id) {
  const nodes = await author('GET', '/api/admin/nodes');
  const node = nodes.find(entry => entry.id === id);
  assert.ok(node, 'missing author node ' + id);
  return node;
}
async function create(kind, parentId, title, details = {}) {
  const result = await author('POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: 'published-body:' + title, details },
  });
  return result.id;
}
async function changeDraft(id, details) {
  const node = await current(id);
  await author('PATCH', '/api/admin/nodes/' + id, {
    expectedRevision: node.revision,
    content: {
      title: node.draft.title,
      body: node.draft.body,
      details: { ...node.draft.details, ...details },
    },
  });
}
async function publish(id) {
  const node = await current(id);
  await author('POST', '/api/admin/nodes/' + id + '/publish', { expectedRevision: node.revision });
}
async function visibility(id, publicSince, isPublic = true) {
  const node = await current(id);
  await author('POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision: node.revision, isPublic, publicSince,
  });
}
async function publicTree(seriesId) {
  const response = await fetch(base + '/api/public/series/' + seriesId + '/tree');
  assert.equal(response.status, 200);
  return response.json();
}

test('SEARCH-METADATA-01/02/03: tags and word definitions only expose explicitly published snapshots',
  { timeout: 180_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    let seriesId = null;
    try {
      const title = fixture.prefix + '-metadata-search-world';
      const oldTag = 'published-metadata-tag';
      const draftTag = 'unpublished-metadata-tag';
      const oldMeaning = 'published-lexicon-meaning';
      const draftMeaning = 'unpublished-lexicon-meaning';
      const meaningId = randomUUID();
      const meaningData = definition => JSON.stringify([{
        id: meaningId, partOfSpeech: '', definition, etymologies: [],
      }]);
      seriesId = await create('series', null, title);
      const categoryId = await create('category', seriesId, fixture.prefix + '-metadata-category');
      const languageId = await create('language', seriesId, fixture.prefix + '-metadata-language');
      const tipId = await create('tip', categoryId, fixture.prefix + '-metadata-tip', {
        tags: JSON.stringify([oldTag]), relatedTipIds: '[]',
      });
      const wordId = await create('word', languageId, fixture.prefix + '-metadata-word', {
        meanings: meaningData(oldMeaning),
      });
      for (const id of [seriesId, categoryId, languageId, tipId, wordId]) await publish(id);
      const first = await publicTree(seriesId);
      assert.equal(first.find(item => item.id === tipId)?.content.details.tags, JSON.stringify([oldTag]));
      assert.equal(JSON.parse(first.find(item => item.id === wordId)?.content.details.meanings)[0].definition, oldMeaning);

      const reader = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        async function search(term, domain, expectedId, visible) {
          // Reload the public search from a fresh anonymous page so client
          // state from an earlier publication snapshot never proves privacy.
          const page = await reader.newPage();
          try {
            await page.goto(base + '/search?series=' + seriesId);
            await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
            const seriesSelect = page.locator('.search-filters select').first();
            await seriesSelect.locator('option[value="' + seriesId + '"]').waitFor({ state: 'attached' });
            await seriesSelect.selectOption('');
            await seriesSelect.selectOption(seriesId);
            await page.locator('.search-filters select').nth(1).selectOption(domain);
            await page.locator('.search-filters input[type="search"]').fill(term);
            await page.getByRole('status').filter({ hasText: title }).waitFor();
            await page.waitForFunction(
              ({ visible, href }) => {
                const status = document.querySelector('main [role="status"]');
                const links = [...document.querySelectorAll('main .search-result a')];
                return status?.textContent?.includes(visible ? '：1' : '：0')
                  && (visible ? links.length === 1 && links[0].getAttribute('href') === href
                    : links.length === 0);
              },
              { visible, href: '/items/' + expectedId },
              { timeout: 20_000 },
            );
            const links = await page.locator('main .search-result a').all();
            assert.equal(links.length, visible ? 1 : 0, domain + ' query ' + term);
          } finally { await page.close(); }
        }

        // Both indexed detail fields must exist for readers in published snapshots.
        await search(oldTag, 'tips', tipId, true);
        await search(oldMeaning, 'dictionaries', wordId, true);

        // Saving drafts must never update the publicly searchable metadata.
        await changeDraft(tipId, { tags: JSON.stringify([draftTag]) });
        await changeDraft(wordId, { meanings: meaningData(draftMeaning) });
        const beforePublish = await publicTree(seriesId);
        assert.equal(beforePublish.find(n => n.id === tipId)?.content.details.tags, JSON.stringify([oldTag]));
        assert.equal(JSON.parse(beforePublish.find(n => n.id === wordId)?.content.details.meanings)[0].definition, oldMeaning);
        await search(oldTag, 'tips', tipId, true);
        await search(draftTag, 'tips', tipId, false);
        await search(oldMeaning, 'dictionaries', wordId, true);
        await search(draftMeaning, 'dictionaries', wordId, false);

        // Only explicit author publication changes the anonymous search index.
        await publish(tipId);
        await publish(wordId);
        await search(oldTag, 'tips', tipId, false);
        await search(draftTag, 'tips', tipId, true);
        await search(oldMeaning, 'dictionaries', wordId, false);
        await search(draftMeaning, 'dictionaries', wordId, true);

        // Public children of future-dated ancestors disappear from both
        // the search list and direct anonymous item URLs.
        await visibility(categoryId, future);
        await visibility(languageId, future);
        const hiddenTree = await publicTree(seriesId);
        assert.ok(!hiddenTree.some(n => n.id === tipId || n.id === wordId));
        await search(draftTag, 'tips', tipId, false);
        await search(draftMeaning, 'dictionaries', wordId, false);
        for (const id of [tipId, wordId]) {
          const direct = await fetch(base + '/api/public/items/' + id);
          assert.equal(direct.status, 404);
          assert.ok(!(await direct.text()).includes(draftTag));
        }
      } finally { await reader.close(); }
    } finally {
      if (seriesId) {
        try { await visibility(seriesId, null, false); }
        catch { /* isolated disposable database: do not mask original failure */ }
      }
      await browser.close();
    }
  });
