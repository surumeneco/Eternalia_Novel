/** PB-06/PB-10: bounded volume projection completeness and non-leakage, not a performance SLA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  newLibrary, createNode, editNode, publishNode, publicTree, publicRecent, setVisibility, toReader,
} from '../dist/index.js';

const at = Date.UTC(2026, 10, 15, 0, 0);
const future = at + 60_000;
const content = title => ({ title, body: 'public:' + title, details: {} });

test('READER-VOLUME-01/02/03: 180+ mixed nodes preserve complete public trees and bounded private-free recent results',
  { timeout: 120_000 }, t => {
    let db = newLibrary();
    const add = (kind, parentId, title, published = true) => {
      const id = randomUUID();
      db = createNode(db, { id, kind, parentId, content: content(title), now: at });
      if (published) db = publishNode(db, id, 1, at);
      return id;
    };

    const seriesA = add('series', null, 'LargeA');
    const visibleCategory = add('category', seriesA, 'LargeA-visible-category');
    const hiddenCategory = add('category', seriesA, 'LargeA-hidden-category');
    const futureCategory = add('category', seriesA, 'LargeA-future-category');
    const visibleLanguage = add('language', seriesA, 'LargeA-visible-language');
    const seriesB = add('series', null, 'LargeB');
    const categoryB = add('category', seriesB, 'LargeB-category');

    const tipsA = Array.from({ length: 64 }, (_, i) =>
      add('tip', visibleCategory, 'A-tip-' + String(i).padStart(3, '0')));
    const wordsA = Array.from({ length: 24 }, (_, i) =>
      add('word', visibleLanguage, 'A-word-' + String(i).padStart(3, '0')));
    const hiddenTips = Array.from({ length: 32 }, (_, i) =>
      add('tip', hiddenCategory, 'HIDDEN-tip-' + String(i).padStart(3, '0')));
    const futureTips = Array.from({ length: 32 }, (_, i) =>
      add('tip', futureCategory, 'FUTURE-tip-' + String(i).padStart(3, '0')));
    const draftTips = Array.from({ length: 12 }, (_, i) =>
      add('tip', visibleCategory, 'UNPUBLISHED-tip-' + String(i).padStart(3, '0'), false));
    const tipsB = Array.from({ length: 16 }, (_, i) =>
      add('tip', categoryB, 'B-tip-' + String(i).padStart(3, '0')));
    assert.equal(db.nodes.length, 187, 'fixture contains 187 distinct author nodes');

    db = setVisibility(db, hiddenCategory, 1, false, null, at);
    db = setVisibility(db, futureCategory, 1, true, future, at);
    const secret = 'UNPUBLISHED-EDIT-' + randomUUID();
    for (const id of tipsA.slice(0, 12)) {
      const item = db.nodes.find(node => node.id === id);
      assert.ok(item);
      db = editNode(db, id, item.revision, {
        ...item.draft, body: secret,
      }, at + 1);
    }

    const tick = performance.now();
    const a = publicTree(db, seriesA, at + 1);
    const b = publicTree(db, seriesB, at + 1);
    const recents = publicRecent(db, at + 1, 500);
    const projectionMs = performance.now() - tick;
    // Runtime is diagnostic only. No response-time or production-load threshold is adopted.
    t.diagnostic('nodes=' + db.nodes.length + ', publicTree(A)=' + a.length +
      ', publicTree(B)=' + b.length + ', cappedRecent=' + recents.length +
      ', projectionMs=' + projectionMs.toFixed(2));

    const aExpected = new Set([seriesA, visibleCategory, visibleLanguage, ...tipsA, ...wordsA]);
    const bExpected = new Set([seriesB, categoryB, ...tipsB]);
    assert.equal(a.length, aExpected.size, 'no truncation, duplicate or unverified items in A tree');
    assert.deepEqual(new Set(a.map(node => node.id)), aExpected);
    assert.equal(b.length, bExpected.size, 'no A/B series mixing');
    assert.deepEqual(new Set(b.map(node => node.id)), bExpected);
    assert.equal(new Set(a.map(node => node.id)).size, a.length, 'A has no duplicated IDs');
    assert.equal(new Set(b.map(node => node.id)).size, b.length, 'B has no duplicated IDs');

    const forbidden = new Set([
      hiddenCategory, futureCategory, ...hiddenTips, ...futureTips, ...draftTips,
    ]);
    for (const id of forbidden) {
      assert.ok(!aExpected.has(id));
      assert.equal(toReader(db, id, at + 1), null, 'private/scheduled/draft item ' + id);
    }
    assert.equal(recents.length, 50, 'requested 500 recent entries are clamped to 50');
    assert.deepEqual(publicRecent(db, at + 1, 0), []);
    const visibleLeafIds = new Set([...tipsA, ...wordsA, ...tipsB]);
    for (const node of recents) {
      assert.ok(visibleLeafIds.has(node.id), 'recent must contain only visible leaf IDs');
      assert.ok(!forbidden.has(node.id), 'recent cannot include private/draft/ancestor-hidden IDs');
    }
    assert.ok(!JSON.stringify(a).includes(secret), 'author draft content is never included in tree');
    assert.ok(!JSON.stringify(recents).includes(secret), 'author draft content is never included in recent');

    const afterSchedule = publicTree(db, seriesA, future);
    assert.equal(afterSchedule.length, aExpected.size + futureTips.length + 1,
      'future category and descendants join at exact boundary, hidden category stays private');
    for (const id of [...hiddenTips, ...draftTips]) {
      assert.ok(!afterSchedule.some(node => node.id === id));
    }
  });
