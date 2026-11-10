// TASK-20261101-009: Draft EDITOR-GB11-01..04.
// Fallback-only Unicode boundary tests; Android/IME/Chromium not-run.
import test from 'node:test';
import assert from 'node:assert/strict';
import { insertManuscriptMarkup as insert } from '../app/utils/manuscript-markup.ts';

function withoutSegmenter(action) {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    return action();
  } finally {
    Intl.Segmenter = original;
  }
}

for (const scenario of [
  { name: 'plain letter after ZWJ', source: '前a\u200Db後', expected: '前a\u200D[[page]]b後' },
  { name: 'emoji after non-pictographic ZWJ', source: '前a\u200D💻後', expected: '前a\u200D[[page]]💻後' },
]) {
  test('fallback allows GB11 boundary for ' + scenario.name, () => {
    const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
    assert.equal(segmenter.segment(scenario.source).containing(3)?.index, 3,
      'reference Segmenter requires a boundary after non-pictographic ZWJ');
    withoutSegmenter(() => {
      assert.equal(insert(scenario.source, 3, 3, 'page')?.value, scenario.expected);
    });
  });
}

test('fallback still rejects an internal pictographic emoji ZWJ boundary', () => {
  const source = '前👩\u200D💻後';
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  assert.notEqual(segmenter.segment(source).containing(4)?.index, 4);
  withoutSegmenter(() => {
    assert.equal(insert(source, 4, 4, 'page'), null);
    assert.equal(insert(source, 4, 4, 'ruby'), null);
  });
});

test('fallback allows ruby for a complete non-emoji ZWJ grapheme', () => {
  const source = '前a\u200Db後';
  withoutSegmenter(() => {
    assert.deepEqual(insert(source, 1, 3, 'ruby'), {
      value: '前｜a\u200D《よみ》b後',
      selectionStart: 5,
      selectionEnd: 7,
    });
  });
});
