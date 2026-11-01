import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createNode, editNode, newLibrary, publishNode, setVisibility, toReader,
} from '../dist/index.js';

const ids = {
  series: '81000000-0000-0000-0000-000000000001',
  sourceCategory: '81000000-0000-0000-0000-000000000002',
  targetCategory: '81000000-0000-0000-0000-000000000003',
  source: '81000000-0000-0000-0000-000000000004',
  target: '81000000-0000-0000-0000-000000000005',
};
const contentOf = (title, details = {}) => ({ title, body: title + '-body', details });
const byId = (db, id) => db.nodes.find(node => node.id === id);

function setupPublishedRelatedTips() {
  let db = newLibrary();
  db = createNode(db, { id: ids.series, kind: 'series', content: contentOf('Series'), now: 1000 });
  db = createNode(db, { id: ids.sourceCategory, kind: 'category', parentId: ids.series,
    content: contentOf('Source category'), now: 1001 });
  db = createNode(db, { id: ids.targetCategory, kind: 'category', parentId: ids.series,
    content: contentOf('Target category'), now: 1002 });
  db = createNode(db, { id: ids.source, kind: 'tip', parentId: ids.sourceCategory,
    content: contentOf('Source'), now: 1003 });
  db = createNode(db, { id: ids.target, kind: 'tip', parentId: ids.targetCategory,
    content: contentOf('Target'), now: 1004 });
  for (const id of [ids.series, ids.sourceCategory, ids.targetCategory, ids.target]) {
    db = publishNode(db, id, 1, 2000);
  }
  db = editNode(db, ids.source, 1,
    contentOf('Source', { relatedTipIds: JSON.stringify([ids.target]) }), 2001);
  db = publishNode(db, ids.source, 2, 2002);
  return db;
}
const publicRelated = (db, now) =>
  JSON.parse(toReader(db, ids.source, now).content.details.relatedTips).map(item => item.id);

test('AC-06/31/70: cross-category related Tip respects target ancestor visibility', () => {
  let db = setupPublishedRelatedTips();
  assert.deepEqual(publicRelated(db, 3000), [ids.target]);
  assert.equal(toReader(db, ids.target, 3000)?.id, ids.target);

  db = setVisibility(db, ids.targetCategory, 1, false, null, 3001);
  assert.equal(toReader(db, ids.target, 3002), null);
  assert.deepEqual(publicRelated(db, 3002), []);
  assert.equal(byId(db, ids.target).isPublic, true,
    'hiding an ancestor must not overwrite a descendant publication flag');
  assert.deepEqual(JSON.parse(byId(db, ids.source).draft.details.relatedTipIds), [ids.target],
    'the author relation must remain intact');
  assert.equal(toReader(db, ids.source, 3002).content.body, 'Source-body');

  db = setVisibility(db, ids.targetCategory, 2, true, null, 3003);
  assert.deepEqual(publicRelated(db, 3004), [ids.target]);
  assert.equal(toReader(db, ids.target, 3004)?.id, ids.target);
});

test('AC-06: unpublished target category snapshot cannot leak via a published relation', () => {
  let db = setupPublishedRelatedTips();
  // Remove only the category publication snapshot in a fresh copy of the
  // otherwise public fixture. Its descendant remains individually published.
  const targetCategory = byId(db, ids.targetCategory);
  db = { ...db, nodes: db.nodes.map(node => node.id === ids.targetCategory
    ? { ...targetCategory, published: null }
    : node) };
  assert.equal(toReader(db, ids.target, 3000), null);
  assert.deepEqual(publicRelated(db, 3000), []);
});
