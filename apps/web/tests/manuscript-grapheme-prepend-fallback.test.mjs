import test from 'node:test';
import assert from 'node:assert/strict';
import { insertManuscriptMarkup as insert } from '../app/utils/manuscript-markup.ts';

// TASK-20261101-009 / EDIT-PREPEND-01..04: Draft Red vectors, not confirmed.
for (const [name, cluster] of [
  ['Arabic number sign U+0600', '\u0600\u0627'],
  ['Arabic end of ayah U+06DD', '\u06DD\u0628'],
  ['Syriac abbreviation mark U+070F', '\u070F\u0710'],
]) {
  test('fallback must not split GB9b Prepend cluster: ' + name, () => {
    const reference = [...new Intl.Segmenter('ja', { granularity: 'grapheme' })
      .segment(cluster)];
    assert.equal(reference.length, 1, 'Intl.Segmenter oracle must see one grapheme');
    const original = Intl.Segmenter;
    try {
      Intl.Segmenter = undefined;
      const source = '前' + cluster + '後';
      const inside = 2; // after the BMP Prepend code point
      assert.equal(insert(source, inside, inside, 'page'), null);
      assert.equal(insert(source, inside, inside, 'ruby'), null);
    } finally {
      Intl.Segmenter = original;
    }
  });
}

test('fallback still permits insertion after a complete Prepend cluster', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    const cluster = '\u0600\u0627';
    const source = '前' + cluster + '後';
    const after = 1 + cluster.length;
    assert.equal(insert(source, after, after, 'page')?.value,
      '前' + cluster + '[[page]]後');
  } finally {
    Intl.Segmenter = original;
  }
});
