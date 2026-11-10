// TASK-20261101-009 / EDITOR-ZWNJ-01..03 (CAT Draft).
// UAX #29 U+200C grapheme fallback; real Android/IME/Chromium not-run.
import test from 'node:test';
import assert from 'node:assert/strict';
import { insertManuscriptMarkup as insert } from '../app/utils/manuscript-markup.ts';

const source = '前a\u200Cb後';

function withoutSegmenter(action) {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    return action();
  } finally {
    Intl.Segmenter = original;
  }
}

test('Intl.Segmenter reference treats ZWNJ as Extend before the next letter', () => {
  const segments = new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(source);
  assert.equal(segments.containing(2)?.index, 1);
  assert.equal(segments.containing(3)?.index, 3);
  assert.equal(insert(source, 2, 2, 'page'), null);
});

test('fallback rejects insertion immediately before ZWNJ inside a grapheme', () => {
  withoutSegmenter(() => {
    assert.equal(insert(source, 2, 2, 'page'), null);
    assert.equal(insert(source, 2, 2, 'ruby'), null);
  });
});

test('fallback preserves the boundary immediately after ZWNJ', () => {
  withoutSegmenter(() => {
    assert.deepEqual(insert(source, 3, 3, 'page'), {
      value: '前a\u200C[[page]]b後',
      selectionStart: 11,
      selectionEnd: 11,
    });
  });
});
