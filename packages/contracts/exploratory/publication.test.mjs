// Exploratory checks only; NOT CAT-TDD generated tests or normative Red/Green evidence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canReadPublished, saveDraft, publishDraft, getReaderSnapshot } from '../dist/index.js';
const now = 1_800_000_000_000;
const yes = { isPublic: true, publicSinceEpochMs: now - 10 };
const no = { isPublic: false, publicSinceEpochMs: now - 10 };
const later = { isPublic: true, publicSinceEpochMs: now + 1 };
const base = {
  draftRevision: 1,
  draftValue: { title: '新規下書き', paragraphs: ['一章'] },
  publishedSnapshot: { sourceDraftRevision: 0, value: { title: '公開済み', paragraphs: ['旧版'] } },
};
test('all ancestors and self must allow publication', () => {
  assert.equal(canReadPublished([yes, yes], true, now), true);
  assert.equal(canReadPublished([no, yes], true, now), false);
  assert.equal(canReadPublished([yes, no], true, now), false);
});
test('published date is exclusive before the boundary', () => {
  assert.equal(canReadPublished([yes, later], true, now), false);
  assert.equal(canReadPublished([{ isPublic: true, publicSinceEpochMs: now }], true, now), true);
});
test('a missing published version never exposes draft', () => {
  const draftOnly = { ...base, publishedSnapshot: null };
  assert.deepEqual(getReaderSnapshot(draftOnly, [yes, yes], now), { found: false });
});
test('saving draft leaves reader snapshot unchanged', () => {
  const saved = saveDraft(base, 1, { title: '執筆中', paragraphs: ['変更'] });
  assert.equal(saved.ok, true);
  if (saved.ok) {
    assert.equal(saved.next.publishedSnapshot.value.title, '公開済み');
    assert.equal(saved.next.publishedSnapshot.sourceDraftRevision, 0);
    assert.equal(getReaderSnapshot(saved.next, [yes, yes], now).content.title, '公開済み');
  }
});
test('explicit publication uses the draft at its current revision', () => {
  const published = publishDraft(base, 1);
  assert.equal(published.ok, true);
  if (published.ok) {
    assert.equal(published.next.publishedSnapshot.sourceDraftRevision, 1);
    assert.deepEqual(published.next.publishedSnapshot.value, base.draftValue);
    assert.notStrictEqual(published.next.publishedSnapshot.value, base.draftValue);
  }
});
test('stale client revision is rejected for both operations', () => {
  assert.deepEqual(saveDraft(base, 0, { x: 'bad' }), { ok: false, reason: 'revision-conflict' });
  assert.deepEqual(publishDraft(base, 0), { ok: false, reason: 'revision-conflict' });
});
test('a hidden parent blocks read while preserving stored snapshot', () => {
  assert.deepEqual(getReaderSnapshot(base, [no, yes], now), { found: false });
  assert.equal(base.publishedSnapshot.value.title, '公開済み');
});
test('reader gets independent data, not a mutable snapshot reference', () => {
  const reader = getReaderSnapshot(base, [yes, yes], now);
  assert.equal(reader.found, true);
  if (reader.found) {
    reader.content.paragraphs[0] = '改竄';
    assert.equal(base.publishedSnapshot.value.paragraphs[0], '旧版');
  }
});

test('a deliberately published JSON null remains distinct from no snapshot', () => {
  const record = { draftRevision: 1, draftValue: null, publishedSnapshot: { sourceDraftRevision: 1, value: null } };
  assert.deepEqual(getReaderSnapshot(record, [yes], now), { found: true, content: null });
});
