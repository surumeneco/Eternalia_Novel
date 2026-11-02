// TASK-20261101-009: code-to-spec Candidate for GB4/GB5 before GB9.
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

function referenceHasBoundary(source, offset) {
  const segments = new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(source);
  return segments.containing(offset)?.index === offset;
}

test('fallback allows boundary after LF before combining mark', () => {
  const source = '前\n\u3099後';
  assert.equal(referenceHasBoundary(source, 2), true);
  withoutSegmenter(() => {
    assert.equal(insert(source, 2, 2, 'page')?.value, '前\n[[page]]\u3099後');
  });
});

for (const [name, control] of [['CR', '\r'], ['NEL', '\u0085']]) {
  test('fallback allows boundary after ' + name + ' before combining mark', () => {
    const source = '前' + control + '\u3099後';
    assert.equal(referenceHasBoundary(source, 2), true);
    withoutSegmenter(() => {
      assert.equal(insert(source, 2, 2, 'page')?.value,
        '前' + control + '[[page]]\u3099後');
    });
  });
}

test('fallback rejects boundary inside kana combining cluster', () => {
  const source = '前か\u3099後';
  assert.equal(referenceHasBoundary(source, 2), false);
  withoutSegmenter(() => {
    assert.equal(insert(source, 2, 2, 'page'), null);
  });
});

test('fallback still rejects inside CRLF pair', () => {
  const source = '前\r\n後';
  assert.equal(referenceHasBoundary(source, 2), false);
  withoutSegmenter(() => {
    assert.equal(insert(source, 2, 2, 'page'), null);
  });
});
