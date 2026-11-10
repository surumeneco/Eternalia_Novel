// Exploratory contract tests for ST-04/ST-05/ST-09.
// This is not CAT-generated test evidence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  newLibrary, createNode, editNode, publishNode, setVisibility,
  toReader, parseTipTags, parseTipRelationIds,
} from '../dist/index.js';

const now = Date.UTC(2026, 9, 30);
const content = (title, details = {}) => ({ title, body: '', details });
function add(db, kind, parentId, title, details) {
  const id = randomUUID();
  return { id, db: createNode(db, { id, kind, parentId, content: content(title, details), now }) };
}
function fixture() {
  let db = newLibrary();
  const series = add(db, 'series', null, 'world'); db = series.db;
  const category = add(db, 'category', series.id, 'people'); db = category.db;
  const extraCategory = add(db, 'category', series.id, 'places'); db = extraCategory.db;
  const first = add(db, 'tip', category.id, 'first'); db = first.db;
  const second = add(db, 'tip', extraCategory.id, 'second'); db = second.db;
  const otherSeries = add(db, 'series', null, 'other world'); db = otherSeries.db;
  const otherCategory = add(db, 'category', otherSeries.id, 'private category'); db = otherCategory.db;
  const foreign = add(db, 'tip', otherCategory.id, 'foreign'); db = foreign.db;
  return { db, series, category, extraCategory, first, second, otherSeries, otherCategory, foreign };
}
test('tip tags validate nonempty unique labels; relation IDs preserve deliberate order', () => {
  assert.deepEqual(parseTipTags('["people","travel"]'), ['people','travel']);
  assert.deepEqual(parseTipRelationIds('["a","b"]'), ['a','b']);
  assert.throws(() => parseTipTags('["people","people"]'));
  assert.throws(() => parseTipTags('[""]'));
  assert.throws(() => parseTipRelationIds('["a","a"]'));
  assert.throws(() => parseTipRelationIds('{"id":"a"}'));
});
test('tip relations reject self, absent, non-tip and cross-series targets', () => {
  const { db, first, second, category, foreign } = fixture();
  assert.throws(() => editNode(db, first.id, 1,
    content('first', { relatedTipIds: JSON.stringify([first.id]) }), now + 1));
  assert.throws(() => editNode(db, first.id, 1,
    content('first', { relatedTipIds: JSON.stringify([foreign.id]) }), now + 1));
  assert.throws(() => editNode(db, first.id, 1,
    content('first', { relatedTipIds: JSON.stringify([category.id]) }), now + 1));
  assert.throws(() => editNode(db, first.id, 1,
    content('first', { relatedTipIds: JSON.stringify([randomUUID()]) }), now + 1));
  assert.doesNotThrow(() => editNode(db, first.id, 1,
    content('first', { relatedTipIds: JSON.stringify([second.id]) }), now + 1));
});
test('published tip only exposes published related tips that pass ancestor visibility gate', () => {
  let { db, series, category, extraCategory, first, second } = fixture();
  db = editNode(db, first.id, 1, content('first', {
    tags: JSON.stringify(['shared']),
    relatedTipIds: JSON.stringify([second.id]),
  }), now + 1);
  for (const id of [series.id, category.id, extraCategory.id])
    db = publishNode(db, id, 1, now + 2);
  db = publishNode(db, first.id, 2, now + 2);
  let reader = toReader(db, first.id, now + 3);
  assert.equal(reader.content.details.tags, '["shared"]');
  assert.deepEqual(JSON.parse(reader.content.details.relatedTips), [], 'unpublished target is not disclosed');
  assert.equal(reader.content.details.relatedTipIds, undefined, 'raw private IDs must not be exposed');

  db = publishNode(db, second.id, 1, now + 4);
  reader = toReader(db, first.id, now + 5);
  assert.deepEqual(JSON.parse(reader.content.details.relatedTips), [{ id: second.id, title: 'second' }]);
  db = setVisibility(db, extraCategory.id, 1, false, null, now + 6);
  assert.deepEqual(JSON.parse(toReader(db, first.id, now + 7).content.details.relatedTips), [],
    'nonpublic ancestor hides related target');
});
test('tip tags and references obey draft vs explicit published snapshot', () => {
  let { db, series, category, extraCategory, first, second } = fixture();
  for (const id of [series.id, category.id, extraCategory.id, second.id]) db = publishNode(db,id,1,now);
  db = publishNode(db,first.id,1,now);
  db = editNode(db,first.id,1,content('first',{
    tags: '["private-draft"]', relatedTipIds: JSON.stringify([second.id]),
  }),now + 1);
  assert.equal(toReader(db,first.id,now + 2).content.details.tags, undefined,
    'draft details must stay private');
  db = publishNode(db,first.id,2,now + 3);
  const reader = toReader(db,first.id,now + 4);
  assert.equal(reader.content.details.tags,'["private-draft"]');
  assert.deepEqual(JSON.parse(reader.content.details.relatedTips),[{id:second.id,title:'second'}]);
});