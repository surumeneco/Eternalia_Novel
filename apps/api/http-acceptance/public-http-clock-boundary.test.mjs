/** PB-05/AC-45/54/70: exact millisecond public-gate HTTP via DI-controlled Nest clock.
 * The override exists only in this separately created test application:
 * production has no request parameter or environment override for the clock.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import 'reflect-metadata';

const require = createRequire(import.meta.url);
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module.js');
const { PublicClock } = require('../dist/public-clock.service.js');
const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const web = process.env.HTTP_BASE_URL;

async function author(method, path, data) {
  const res = await fetch(web + path, {
    method,
    headers: {
      Origin: web, 'Content-Type': 'application/json',
      Cookie: 'eternalia_author=' + fixture.authorToken,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const body = await res.text();
  return { status: res.status, body, json: () => JSON.parse(body) };
}
async function node(id) {
  const res = await author('GET', '/api/admin/nodes');
  assert.equal(res.status, 200, res.body);
  const found = res.json().find(n => n.id === id);
  assert.ok(found, 'missing admin node ' + id);
  return found;
}
async function create(kind, parentId, title) {
  const res = await author('POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: 'published:' + title, details: {} },
  });
  assert.equal(res.status, 201, res.body);
  return res.json().id;
}
async function publish(id) {
  const n = await node(id);
  const res = await author('POST', '/api/admin/nodes/' + id + '/publish', {
    expectedRevision: n.revision,
  });
  assert.equal(res.status, 200, res.body);
}
async function schedule(id, time, isPublic = true) {
  const n = await node(id);
  const res = await author('POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision: n.revision, isPublic, publicSince: time,
  });
  assert.equal(res.status, 200, res.body);
}
async function read(origin, path) {
  const res = await fetch(origin + path, { redirect: 'manual' });
  const body = await res.text();
  return { status: res.status, body, json: () => JSON.parse(body) };
}
const idsOf = response => new Set(response.json().map(n => n.id));

test('CLOCK-HTTP-01/02/03/04: four domains and ancestors meet the exact UTC millisecond release instant',
  { timeout: 120_000 }, async () => {
    assert.ok(web?.startsWith('http://127.0.0.1:'));
    const future = Date.now() + 60 * 60 * 1000;
    const prefix = fixture.prefix + '-clock-ms-';
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    let seriesId;
    try {
      await app.listen(0, '127.0.0.1');
      const address = app.getHttpServer().address();
      assert.ok(address && typeof address !== 'string');
      const direct = 'http://127.0.0.1:' + address.port;
      const clock = app.get(PublicClock);
      let current = future - 1;
      clock.now = () => current;

      seriesId = await create('series', null, prefix + 'series');
      const volume = await create('volume', seriesId, prefix + 'volume');
      const part = await create('part', volume, prefix + 'part');
      const chapter = await create('chapter', part, prefix + 'chapter');
      const category = await create('category', seriesId, prefix + 'category');
      const tip = await create('tip', category, prefix + 'tip');
      const language = await create('language', seriesId, prefix + 'language');
      const word = await create('word', language, prefix + 'word');
      const period = await create('periodization', seriesId, prefix + 'period');
      const event = await create('event', period, prefix + 'event');
      const all = [seriesId, volume, part, chapter, category, tip, language, word, period, event];
      const leaves = [chapter, tip, word, event];
      for (const id of all) await publish(id);
      const snapshots = new Map();
      for (const id of leaves) {
        const before = await read(web, '/api/public/items/' + id);
        assert.equal(before.status, 200);
        snapshots.set(id, before.json().content);
        await schedule(id, future);
        assert.equal((await node(id)).publicSince, future, 'UTC epoch must persist exactly');
      }

      // T-1ms: each leaf remains hidden from all public projections.
      for (const id of leaves) {
        const item = await read(direct, '/api/public/items/' + id);
        assert.equal(item.status, 404, 'item must not release before T');
        assert.equal((await read(direct, '/api/public/items/' + id + '/path')).status, 404);
        assert.ok(!item.body.includes(prefix), 'hidden item leaked its title');
      }
      const treeBefore = await read(direct, '/api/public/series/' + seriesId + '/tree');
      assert.equal(treeBefore.status, 200);
      const recentBefore = await read(direct, '/api/public/recent');
      assert.equal(recentBefore.status, 200);
      for (const id of leaves) {
        assert.equal(idsOf(treeBefore).has(id), false);
        assert.equal(idsOf(recentBefore).has(id), false);
      }

      // Equality is publicly readable; it must expose the *same* snapshot.
      current = future;
      for (const id of leaves) {
        const item = await read(direct, '/api/public/items/' + id);
        assert.equal(item.status, 200, 'equality must release ' + id);
        assert.deepEqual(item.json().content, snapshots.get(id));
        const path = await read(direct, '/api/public/items/' + id + '/path');
        assert.equal(path.status, 200);
        assert.equal(path.json().at(-1).id, id);
      }
      const atT = await read(direct, '/api/public/series/' + seriesId + '/tree');
      const recentAtT = await read(direct, '/api/public/recent');
      for (const id of leaves) {
        assert.ok(idsOf(atT).has(id), 'published leaf missing from tree at equality');
        assert.ok(idsOf(recentAtT).has(id), 'published leaf missing from recent at equality');
      }

      current = future + 1;
      for (const id of leaves) {
        const item = await read(direct, '/api/public/items/' + id);
        assert.equal(item.status, 200);
        assert.deepEqual(item.json().content, snapshots.get(id));
      }

      // An ancestor's *later* schedule still blocks every previously released leaf.
      const ancestorTime = future + 10;
      await schedule(seriesId, ancestorTime);
      current = ancestorTime - 1;
      assert.equal(idsOf(await read(direct, '/api/public/series')).has(seriesId), false);
      for (const id of leaves) {
        assert.equal((await read(direct, '/api/public/items/' + id)).status, 404);
        assert.equal((await read(direct, '/api/public/items/' + id + '/path')).status, 404);
      }
      current = ancestorTime;
      assert.equal(idsOf(await read(direct, '/api/public/series')).has(seriesId), true);
      for (const id of leaves) {
        const restored = await read(direct, '/api/public/items/' + id);
        assert.equal(restored.status, 200);
        assert.deepEqual(restored.json().content, snapshots.get(id));
      }
    } finally {
      // These records belong only to the disposable test database.
      if (seriesId) {
        try { await schedule(seriesId, null, false); }
        catch { /* Preserve the original assertion failure. */ }
      }
      await app.close();
    }
  });
