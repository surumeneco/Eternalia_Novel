// ST-03 author data integrity: a category must not persist unusable presets.
// Exploratory tests, not CAT-generated vectors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createNode, newLibrary } from '../dist/index.js';

const now = Date.UTC(2026, 9, 30);
function addCategory(details) {
  let db = createNode(newLibrary(), {
    id: randomUUID(), kind: 'series',
    content: { title: '世界', body: '', details: {} }, now,
  });
  const series = db.nodes[0];
  return createNode(db, {
    id: randomUUID(), kind: 'category', parentId: series.id,
    content: { title: '人物', body: '', details }, now,
  });
}

test('category creation rejects a malformed preset JSON before persistence', () => {
  assert.throws(() => addCategory({ presets: '{not-json' }),
    error => error?.code === 'bad-request');
});

test('category creation rejects a non-list preset container before persistence', () => {
  assert.throws(() => addCategory({ presets: '{"title":"人物"}' }),
    error => error?.code === 'bad-request');
});

test('category creation accepts valid presets including empty lists', () => {
  const empty = addCategory({ presets: '[]' });
  const populated = addCategory({ presets: JSON.stringify([
    { title: '外見', body: '未定' },
    { title: '性格', body: '' },
  ]) });
  assert.equal(empty.nodes.filter(node => node.kind === 'category').length, 1);
  assert.equal(populated.nodes.find(node => node.kind === 'category')
    .draft.details.presets, '[{"title":"外見","body":"未定"},{"title":"性格","body":""}]');
});
