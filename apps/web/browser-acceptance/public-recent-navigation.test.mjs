/**
 * AC-55 / PB-06: the anonymous home recent list must actually open the
 * published reader for each route class, not merely render a matching label.
 * Real Nuxt, Nest, PostgreSQL and Chromium; synthetic author seeding only.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

assert.equal(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB, '1');
assert.notEqual(process.env.NODE_ENV, 'production');
const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
assert.match(base ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);

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
  assert.ok(response.ok, method + ' ' + path + ': ' + response.status + ' ' + body);
  return JSON.parse(body);
}
async function create(kind, parentId, title) {
  return (await author('POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: 'published:' + title, details: {} },
  })).id;
}
async function revision(id) {
  const node = (await author('GET', '/api/admin/nodes')).find(entry => entry.id === id);
  assert.ok(node, 'author node missing: ' + id);
  return node.revision;
}
async function publish(id) {
  await author('POST', '/api/admin/nodes/' + id + '/publish', {
    expectedRevision: await revision(id),
  });
}

test('AC-55: home recent links navigate for all six published item types',
  { timeout: 120_000 }, async () => {
    const prefix = fixture.prefix + '-recent-click-' + randomUUID().slice(0, 8);
    const browser = await chromium.launch({ headless: true });
    let seriesId;
    try {
      seriesId = await create('series', null, prefix + '-series');
      const volumeId = await create('volume', seriesId, prefix + '-volume');
      const partId = await create('part', volumeId, prefix + '-part');
      const chapterTitle = prefix + '-chapter';
      const chapterId = await create('chapter', partId, chapterTitle);
      const categoryId = await create('category', seriesId, prefix + '-category');
      const tipTitle = prefix + '-tip';
      const tipId = await create('tip', categoryId, tipTitle);
      const tipSectionTitle = prefix + '-tip-section';
      const tipSectionId = await create('tipSection', tipId, tipSectionTitle);
      const languageId = await create('language', seriesId, prefix + '-language');
      const wordTitle = prefix + '-word';
      const wordId = await create('word', languageId, wordTitle);
      const grammarTitle = prefix + '-grammar';
      const grammarId = await create('grammar', languageId, grammarTitle);
      const periodId = await create('periodization', seriesId, prefix + '-period');
      const eventTitle = prefix + '-event';
      const eventId = await create('event', periodId, eventTitle);
      for (const id of [seriesId, volumeId, partId, chapterId, categoryId, tipId,
        tipSectionId, languageId, wordId, grammarId, periodId, eventId]) {
        await publish(id);
      }

      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        const page = await context.newPage();
        const destinations = [
          { id: chapterId, title: chapterTitle, path: '/series/' + seriesId + '/stories/' + volumeId + '/parts/' + partId + '/chapters/' + chapterId },
          { id: tipId, title: tipTitle, path: '/series/' + seriesId + '/settings/' + categoryId + '/' + tipId },
          { id: tipSectionId, title: tipSectionTitle, path: '/series/' + seriesId + '/settings/' + categoryId + '/' + tipId + '/sections/' + tipSectionId },
          { id: wordId, title: wordTitle, path: '/series/' + seriesId + '/dictionaries/' + languageId + '/words/' + wordId },
          { id: grammarId, title: grammarTitle, path: '/series/' + seriesId + '/dictionaries/' + languageId + '/grammar/' + grammarId },
          { id: eventId, title: eventTitle, path: '/series/' + seriesId + '/timeline/periods/' + periodId + '/events/' + eventId },
        ];
        for (const { id, title, path } of destinations) {
          await page.goto(base + '/');
          const recentList = page.locator('main ol.reader-list');
          const link = recentList.getByRole('link', { name: title, exact: true });
          await link.waitFor();
          assert.equal(await link.getAttribute('href'), '/jump/' + id,
            'new-post jump must target the published reader by stable ID');
          await link.click();
          await page.waitForURL(url => url.pathname === path);
          await page.getByRole('heading', { name: title, exact: true }).waitFor();
          await page.getByText('published:' + title, { exact: false }).waitFor();
          assert.equal(await page.locator('main [role="alert"]').count(), 0);
        }
        await page.close();
      } finally {
        await context.close();
      }
    } finally {
      if (seriesId) {
        try {
          await author('POST', '/api/admin/nodes/' + seriesId + '/visibility', {
            expectedRevision: await revision(seriesId), isPublic: false, publicSince: null,
          });
        } catch { /* preserve the primary assertion failure */ }
      }
      await browser.close();
    }
  });
