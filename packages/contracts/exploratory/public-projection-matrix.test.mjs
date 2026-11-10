// Cross-domain public-gate regression: no private ancestor, draft, or future date
// may be exposed through any reader projection. Exploratory, not CAT-generated.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  newLibrary, createNode, editNode, publishNode, setVisibility,
  toReader, publicTree, publicPath, publicRecent,
} from '../dist/index.js';

const now = Date.UTC(2026, 9, 30, 0, 0, 0);
const routes = [
  ['series', 'volume', 'part', 'chapter'],
  ['series', 'category', 'tip', 'tipSection'],
  ['series', 'language', 'word'],
  ['series', 'language', 'grammar'],
  ['series', 'periodization', 'event'],
];
function fixture(route) {
  let db = newLibrary();
  const ids = [];
  for (const kind of route) {
    const id = randomUUID();
    db = createNode(db, {
      id, kind, parentId: ids.at(-1) ?? null, now,
      content: { title: 'published-' + kind, body: 'public-' + kind, details: {} },
    });
    ids.push(id);
  }
  for (const id of ids) db = publishNode(db, id, 1, now);
  return { db, ids, leaf: ids.at(-1), series: ids[0] };
}
function verifyAbsent(db, ids, leaf, series, when) {
  assert.equal(toReader(db, leaf, when), null, 'direct reader');
  assert.deepEqual(publicPath(db, leaf, when), [], 'public breadcrumb');
  assert.ok(!publicTree(db, series, when).some(node => node.id === leaf), 'public collection');
  assert.ok(!publicRecent(db, when).some(node => node.id === leaf), 'recent feed');
}

for (const route of routes) {
  const label = route.join(' / ');
  test(label + ': each ancestor and self independently denies read across all projections', () => {
    const original = fixture(route);
    assert.equal(toReader(original.db, original.leaf, now + 1)?.kind, route.at(-1));
    assert.equal(publicPath(original.db, original.leaf, now + 1).length, original.ids.length);
    for (const protectedId of original.ids) {
      const hidden = setVisibility(original.db, protectedId, 1, false, null, now);
      verifyAbsent(hidden, original.ids, original.leaf, original.series, now + 1);
      assert.ok(hidden.nodes.find(node => node.id === original.leaf)?.published,
        'hiding must not erase published child snapshot');
      const restored = setVisibility(hidden, protectedId, 2, true, now, now + 2);
      assert.equal(toReader(restored, original.leaf, now + 3)?.content.title,
        'published-' + route.at(-1), 'restoring ancestor cannot overwrite child snapshot');
    }
  });
  test(label + ': scheduled ancestor has an exact millisecond boundary', () => {
    const { db, ids, leaf, series } = fixture(route);
    const future = now + 60_000;
    for (const protectedId of ids) {
      const scheduled = setVisibility(db, protectedId, 1, true, future, now);
      verifyAbsent(scheduled, ids, leaf, series, future - 1);
      assert.equal(toReader(scheduled, leaf, future)?.content.title,
        'published-' + route.at(-1));
      assert.equal(publicPath(scheduled, leaf, future).length, ids.length);
    }
  });
  test(label + ': saving a new author draft never alters the published projection', () => {
    let { db, ids, leaf, series } = fixture(route);
    db = editNode(db, leaf, 1, {
      title: 'secret-draft-' + route.at(-1),
      body: 'private-updated-body',
      details: {},
    }, now + 10);
    const direct = toReader(db, leaf, now + 20);
    assert.equal(direct?.content.title, 'published-' + route.at(-1));
    assert.equal(direct?.content.body, 'public-' + route.at(-1));
    assert.ok(!JSON.stringify(publicTree(db, series, now + 20)).includes('secret-draft-'));
    assert.ok(!JSON.stringify(publicRecent(db, now + 20)).includes('private-updated-body'));
    assert.equal(publicPath(db, leaf, now + 20).at(-1)?.content.title,
      'published-' + route.at(-1));
    assert.equal(db.nodes.find(node => node.id === leaf)?.draft.body, 'private-updated-body');
  });
}

test('public tree stays within one series even if other worlds contain public items', () => {
  const left = fixture(['series', 'category', 'tip']);
  const right = fixture(['series', 'language', 'word']);
  const library = { nodes: [...left.db.nodes, ...right.db.nodes] };
  assert.deepEqual(
    new Set(publicTree(library, left.series, now + 1).map(node => node.id)),
    new Set(left.ids),
  );
  assert.deepEqual(
    new Set(publicTree(library, right.series, now + 1).map(node => node.id)),
    new Set(right.ids),
  );
  const hiddenLeft = setVisibility(library, left.series, 1, false, null, now);
  assert.deepEqual(publicTree(hiddenLeft, left.series, now + 1), []);
  assert.deepEqual(
    new Set(publicTree(hiddenLeft, right.series, now + 1).map(node => node.id)),
    new Set(right.ids),
  );
});
