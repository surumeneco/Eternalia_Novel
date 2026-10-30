// Exploratory regression for the approved parent/child hierarchy of ordered nodes.
// CAT TestModel and canonical gates remain separate from this test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createNode, newLibrary, reorderSiblings } from '../dist/index.js';

const now = Date.UTC(2026, 9, 31);
function add(db, kind, parentId) {
  const id = randomUUID();
  return { id, db: createNode(db, {
    id, kind, parentId, now,
    content: { title: kind, body: '', details: {} },
  }) };
}
test('reorder rejects nonexistent and wrong-kind parents even for empty lists', () => {
  let db = newLibrary();
  const series = add(db, 'series', null); db = series.db;
  const volume = add(db, 'volume', series.id); db = volume.db;
  for (const request of [
    { parentId: randomUUID(), kind: 'volume' },
    { parentId: series.id, kind: 'chapter' },
    { parentId: null, kind: 'volume' },
    { parentId: undefined, kind: 'series' },
    { parentId: volume.id, kind: 'category' },
  ]) {
    assert.throws(() => reorderSiblings(db, {
      ...request, orderedIds: [], expectedRevisions: {},
    }, now + 1), error => error?.code === 'bad-request');
  }
});
test('a valid empty sibling list is a successful no-op', () => {
  let db = newLibrary();
  const series = add(db, 'series', null); db = series.db;
  const before = JSON.stringify(db);
  const result = reorderSiblings(db, {
    parentId: series.id, kind: 'category', orderedIds: [], expectedRevisions: {},
  }, now + 1);
  assert.equal(JSON.stringify(result), before);
});
