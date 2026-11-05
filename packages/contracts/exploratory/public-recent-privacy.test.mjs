// AC-55: recent publication order and privacy are based on public snapshots.
// Exploratory domain verification; not CAT-generated test vectors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createNode, editNode, newLibrary, publicRecent, publishNode, setVisibility } from '../dist/index.js';

const contentOf = (title, body = '') => ({ title, body, details: {} });

test('AC-55: recent ordering ignores unpublished draft edits and excludes hidden chapters', () => {
  const ids = Object.fromEntries(['series', 'volume', 'part', 'older', 'newer']
    .map(name => [name, randomUUID()]));
  let db = newLibrary();
  db = createNode(db, { id: ids.series, kind: 'series',
    content: contentOf('Series'), now: 1 });
  db = createNode(db, { id: ids.volume, kind: 'volume', parentId: ids.series,
    content: contentOf('Volume'), now: 2 });
  db = createNode(db, { id: ids.part, kind: 'part', parentId: ids.volume,
    content: contentOf('Part'), now: 3 });
  db = createNode(db, { id: ids.older, kind: 'chapter', parentId: ids.part,
    content: contentOf('Published older', 'old public text'), now: 4 });
  db = createNode(db, { id: ids.newer, kind: 'chapter', parentId: ids.part,
    content: contentOf('Published newer', 'new public text'), now: 5 });
  for (const id of [ids.series, ids.volume, ids.part]) db = publishNode(db, id, 1, 10);
  db = publishNode(db, ids.older, 1, 100);
  db = publishNode(db, ids.newer, 1, 200);
  assert.deepEqual(publicRecent(db, 400).map(node => node.id), [ids.newer, ids.older]);

  db = editNode(db, ids.older, 1, contentOf('Unpublished draft title', 'secret draft text'), 300);
  const recentAfterDraft = publicRecent(db, 400);
  assert.deepEqual(recentAfterDraft.map(node => node.id), [ids.newer, ids.older]);
  assert.equal(recentAfterDraft[1].content.title, 'Published older');
  assert.equal(recentAfterDraft[1].content.body, 'old public text');

  db = setVisibility(db, ids.newer, 1, false, null, 400);
  assert.deepEqual(publicRecent(db, 500).map(node => node.id), [ids.older]);
});
