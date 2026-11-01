import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNode, editNode, newLibrary, publishNode, setVisibility } from '../dist/index.js';

const contentOf = title => ({ title, body: '', details: {} });
const ids = {
  series: '10000000-0000-0000-0000-000000000001',
  language: '10000000-0000-0000-0000-000000000002',
  privateWord: '10000000-0000-0000-0000-000000000003',
  defaultWord: '10000000-0000-0000-0000-000000000004',
};
function setup() {
  let db = newLibrary();
  db = createNode(db, { id: ids.series, kind: 'series', content: contentOf('Series'), now: 1000 });
  db = createNode(db, { id: ids.language, kind: 'language', parentId: ids.series,
    content: contentOf('Language'), now: 1001 });
  return db;
}
const byId = (db, id) => db.nodes.find(node => node.id === id);

test('PB-16: new words default public but explicit private creation is preserved on publish', () => {
  let db = setup();
  db = createNode(db, { id: ids.privateWord, kind: 'word', parentId: ids.language,
    content: contentOf('Draft word'), isPublic: false, now: 1002 });
  db = createNode(db, { id: ids.defaultWord, kind: 'word', parentId: ids.language,
    content: contentOf('Default word'), now: 1003 });
  assert.equal(byId(db, ids.privateWord).isPublic, false);
  assert.equal(byId(db, ids.defaultWord).isPublic, true);
  assert.equal(byId(db, ids.privateWord).published, null);

  db = publishNode(db, ids.privateWord, 1, 1004);
  assert.equal(byId(db, ids.privateWord).isPublic, false,
    'publishing a private word snapshot must not make it visible');
  assert.ok(byId(db, ids.privateWord).published);

  db = setVisibility(db, ids.privateWord, 1, true, null, 1005);
  assert.equal(byId(db, ids.privateWord).isPublic, true);
});

test('PB-16: creation visibility rejects non-boolean values and non-word overrides', () => {
  let db = setup();
  assert.throws(() => createNode(db, { id: ids.privateWord, kind: 'word',
    parentId: ids.language, content: contentOf('Invalid'), isPublic: 'false', now: 1002 }));
  assert.throws(() => createNode(db, { id: ids.defaultWord, kind: 'language',
    parentId: ids.series, content: contentOf('Invalid'), isPublic: true, now: 1003 }));
});

test('PB-16: republishing an edited private word retains its private setting', () => {
  let db = setup();
  db = createNode(db, { id: ids.privateWord, kind: 'word', parentId: ids.language,
    content: contentOf('Initial'), now: 1002 });
  db = publishNode(db, ids.privateWord, 1, 1003);
  assert.equal(byId(db, ids.privateWord).isPublic, true);
  db = setVisibility(db, ids.privateWord, 1, false, null, 1004);
  assert.equal(byId(db, ids.privateWord).isPublic, false);
  db = editNode(db, ids.privateWord, 2, contentOf('Revised private draft'), 1005);
  db = publishNode(db, ids.privateWord, 3, 1006);
  assert.equal(byId(db, ids.privateWord).isPublic, false);
  assert.equal(byId(db, ids.privateWord).published.value.title, 'Revised private draft');
});

test('PB-16: publishing non-word nodes retains established visibility behavior', () => {
  let db = setup();
  assert.equal(byId(db, ids.series).isPublic, false);
  db = publishNode(db, ids.series, 1, 1002);
  assert.equal(byId(db, ids.series).isPublic, true);
  assert.equal(byId(db, ids.series).published.value.title, 'Series');
});
