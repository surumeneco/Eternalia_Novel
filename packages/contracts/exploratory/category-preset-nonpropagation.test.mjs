// AC-50 / ST-03: category presets are copied only when a new Tip is created.
// Exploratory domain verification; not CAT-generated test vectors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createNode, editNode, newLibrary } from '../dist/index.js';

const contentOf = (title, details = {}) => ({ title, body: '', details });
const preset = (title, body) => JSON.stringify([{ title, body }]);
const sectionsOf = (db, tipId) => db.nodes
  .filter(node => node.kind === 'tipSection' && node.parentId === tipId)
  .map(node => ({ id: node.id, order: node.order, title: node.draft.title, body: node.draft.body }));

test('AC-50: changing category presets affects only future Tips, never existing sections', () => {
  const seriesId = randomUUID();
  const categoryId = randomUUID();
  const tipA = randomUUID();
  const tipB = randomUUID();
  let db = newLibrary();
  db = createNode(db, { id: seriesId, kind: 'series',
    content: contentOf('Series'), now: 1000 });
  db = createNode(db, { id: categoryId, kind: 'category', parentId: seriesId,
    content: contentOf('Category', { presets: preset('P1 heading', 'P1 template') }), now: 1001 });
  db = createNode(db, { id: tipA, kind: 'tip', parentId: categoryId,
    content: contentOf('Tip A'), now: 1002 });
  const initialA = sectionsOf(db, tipA);
  assert.equal(initialA.length, 1);
  assert.equal(initialA[0].title, 'P1 heading');
  assert.equal(initialA[0].body, 'P1 template');

  db = editNode(db, categoryId, 1,
    contentOf('Category', { presets: preset('P2 heading', 'P2 template') }), 1003);
  assert.deepEqual(sectionsOf(db, tipA), initialA,
    'editing a category preset must not mutate previously created TipSections');

  db = createNode(db, { id: tipB, kind: 'tip', parentId: categoryId,
    content: contentOf('Tip B'), now: 1004 });
  const initialB = sectionsOf(db, tipB);
  assert.equal(initialB.length, 1);
  assert.equal(initialB[0].title, 'P2 heading');
  assert.equal(initialB[0].body, 'P2 template');
  assert.notEqual(initialB[0].id, initialA[0].id);

  db = editNode(db, categoryId, 2,
    contentOf('Category', { presets: preset('P3 heading', 'P3 template') }), 1005);
  assert.deepEqual(sectionsOf(db, tipA), initialA);
  assert.deepEqual(sectionsOf(db, tipB), initialB);
});
