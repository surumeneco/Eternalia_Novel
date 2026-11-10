// ST-04/ST-05/ST-09 integration: PostgreSQL and publication-boundary evidence.
// Independent exploratory verification; not a CAT-generated executable test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import {
  createNode, editNode, publishNode, setVisibility, toReader,
} from '@eternalia/contracts';

const require = createRequire(import.meta.url);
require('reflect-metadata');
const { PostgresLibraryService } = require('../dist/postgres-library.service.js');

const now = Date.UTC(2026, 9, 30, 12, 0, 0);
const content = (title, details = {}) => ({ title, body: '', details });

test('PostgreSQL persists tip tags and ordered related tips without exposing private references', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL must identify a disposable migrated test database');
  const storage = new PostgresLibraryService();
  const ids = Object.fromEntries([
    'series', 'category', 'otherCategory', 'source', 'targetA', 'targetB',
    'foreignSeries', 'foreignCategory', 'foreignTip',
  ].map(key => [key, randomUUID()]));
  try {
    await storage.mutate(previous => {
      let db = previous;
      for (const [id, kind, parentId, title] of [
        [ids.series, 'series', null, 'tip-test-world'],
        [ids.category, 'category', ids.series, 'tip-test-people'],
        [ids.otherCategory, 'category', ids.series, 'tip-test-places'],
        [ids.source, 'tip', ids.category, 'source'],
        [ids.targetA, 'tip', ids.otherCategory, 'first'],
        [ids.targetB, 'tip', ids.category, 'second'],
        [ids.foreignSeries, 'series', null, 'other-world'],
        [ids.foreignCategory, 'category', ids.foreignSeries, 'other-category'],
        [ids.foreignTip, 'tip', ids.foreignCategory, 'unrelated'],
      ]) {
        db = createNode(db, { id, kind, parentId, content: content(title), now });
      }
      for (const id of [
        ids.series, ids.category, ids.otherCategory, ids.source, ids.targetA,
        ids.foreignSeries, ids.foreignCategory, ids.foreignTip,
      ]) db = publishNode(db, id, 1, now);
      return db;
    });
    const snapshotBeforeEdit = toReader(await storage.read(), ids.source, now + 1);
    assert.equal(snapshotBeforeEdit.content.details.tags, undefined);

    const relatedTipIds = JSON.stringify([ids.targetB, ids.targetA]);
    await storage.mutate(db => editNode(
      db, ids.source, 1, content('source', {
        tags: JSON.stringify(['人物', '旅']),
        relatedTipIds,
      }), now + 2,
    ));
    let db = await storage.read();
    assert.equal(db.nodes.find(node => node.id === ids.source).draft.details.relatedTipIds, relatedTipIds);
    assert.equal(toReader(db, ids.source, now + 3).content.details.tags, undefined,
      'saving draft must not publish tags or relation changes');

    await assert.rejects(
      storage.mutate(previous => editNode(previous, ids.source, 2, content('source', {
        tags: '["人物"]', relatedTipIds: JSON.stringify([ids.foreignTip]),
      }), now + 4)),
      err => err?.code === 'bad-request',
      'different series is forbidden even when both tips are published',
    );
    assert.equal((await storage.read()).nodes.find(node => node.id === ids.source)
      .draft.details.relatedTipIds, relatedTipIds, 'rejected transaction must not alter stored draft');

    await storage.mutate(previous => publishNode(previous, ids.source, 2, now + 5));
    db = await storage.read();
    let exposed = toReader(db, ids.source, now + 6);
    assert.equal(exposed.content.details.tags, '["人物","旅"]');
    assert.equal(exposed.content.details.relatedTipIds, undefined,
      'raw private IDs are never returned');
    assert.deepEqual(JSON.parse(exposed.content.details.relatedTips), [
      { id: ids.targetA, title: 'first' },
    ], 'unpublished targetB must remain absent even when first in author order');

    await storage.mutate(previous => publishNode(previous, ids.targetB, 1, now + 7));
    exposed = toReader(await storage.read(), ids.source, now + 8);
    assert.deepEqual(JSON.parse(exposed.content.details.relatedTips), [
      { id: ids.targetB, title: 'second' },
      { id: ids.targetA, title: 'first' },
    ], 'author relation order must survive persistence and publication');

    await storage.mutate(previous => setVisibility(
      previous, ids.otherCategory, 1, false, null, now + 9,
    ));
    exposed = toReader(await storage.read(), ids.source, now + 10);
    assert.deepEqual(JSON.parse(exposed.content.details.relatedTips), [
      { id: ids.targetB, title: 'second' },
    ], 'nonpublic ancestor suppresses a related tip');
  } finally {
    await storage.onModuleDestroy();
  }
});
