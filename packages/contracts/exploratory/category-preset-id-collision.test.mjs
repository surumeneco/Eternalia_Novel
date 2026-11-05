// Exploratory AC-49/50 integrity regression, NOT CAT-generated normative tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNode, newLibrary } from '../dist/index.js';

const seriesId = '11111111-1111-4111-8111-111111111111';
const categoryId = '22222222-2222-4222-8222-222222222222';
const firstTipId = '33333333-3333-4333-8333-333333333333';
const collidingTipId = '33333333-3333-4333-8333-333333333334';
const uniqueTipId = '44444444-4444-4444-8444-444444444444';
const contentOf = (title, details = {}) => ({ title, body: '', details });
const add = (db, id, kind, parentId, details) => createNode(db, {
  id, kind, parentId, content: contentOf(kind, details), now: 1730000000000,
});

function libraryWithPreset() {
  let db = add(newLibrary(), seriesId, 'series', null);
  db = add(db, categoryId, 'category', seriesId, {
    presets: JSON.stringify([{ title: '概要', body: '初期本文' }]),
  });
  return db;
}

test('distinct Tip UUIDs sharing first 30 characters cannot generate duplicate TipSection IDs', () => {
  let db = libraryWithPreset();
  db = add(db, firstTipId, 'tip', categoryId);
  const previous = structuredClone(db);
  assert.throws(
    () => add(db, collidingTipId, 'tip', categoryId),
    error => error?.code === 'bad-request',
    'creation must be rejected before creating an ambiguous TipSection ID',
  );
  assert.deepEqual(db, previous, 'failed creation must not mutate the caller library');
  assert.equal(new Set(db.nodes.map(node => node.id)).size, db.nodes.length);
});

test('noncolliding preset copies remain independently identifiable and editable', () => {
  let db = libraryWithPreset();
  db = add(db, firstTipId, 'tip', categoryId);
  db = add(db, uniqueTipId, 'tip', categoryId);
  const sections = db.nodes.filter(node => node.kind === 'tipSection');
  assert.equal(sections.length, 2);
  assert.equal(new Set(sections.map(node => node.id)).size, 2);
  assert.deepEqual(sections.map(node => node.parentId), [firstTipId, uniqueTipId]);
  assert.deepEqual(sections.map(node => node.draft.title), ['概要', '概要']);
});


test('generated section ID cannot shadow a manually assigned section of another Tip', () => {
  let db = libraryWithPreset();
  db = add(db, uniqueTipId, 'tip', categoryId);
  const reservedId = `${collidingTipId.slice(0, 30)}000000`;
  db = add(db, reservedId, 'tipSection', uniqueTipId);
  assert.throws(() => add(db, collidingTipId, 'tip', categoryId),
    error => error?.code === 'bad-request');
  assert.equal(db.nodes.filter(node => node.id === reservedId).length, 1);
  assert.equal(db.nodes.find(node => node.id === reservedId)?.parentId, uniqueTipId);
});

test('similar Tip IDs remain valid when the category has no presets to duplicate', () => {
  let db = add(newLibrary(), seriesId, 'series', null);
  db = add(db, categoryId, 'category', seriesId);
  db = add(db, firstTipId, 'tip', categoryId);
  db = add(db, collidingTipId, 'tip', categoryId);
  assert.equal(db.nodes.filter(node => node.kind === 'tip').length, 2);
  assert.equal(db.nodes.filter(node => node.kind === 'tipSection').length, 0);
});
