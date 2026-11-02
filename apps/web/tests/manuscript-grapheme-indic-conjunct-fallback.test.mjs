// TASK-20261101-009: Draft AC-IME-INDIC-01..04.
// Synthetic UTF-16 fallback checks, not real Android/Windows IME acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { insertManuscriptMarkup as insert } from '../app/utils/manuscript-markup.ts';

const conjuncts = ['क्ष', 'ক্ষ'];

test('Intl.Segmenter reference treats Indic virama conjuncts as single graphemes', () => {
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  for (const cluster of conjuncts) {
    assert.deepEqual([...segmenter.segment(cluster)].map(s => s.segment), [cluster]);
    assert.deepEqual([...segmenter.segment(cluster + cluster)].map(s => s.segment),
      [cluster, cluster]);
  }
});

test('fallback refuses markup inside Indic virama conjuncts', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    for (const cluster of conjuncts) {
      const source = '前' + cluster + '後';
      const inside = 1 + cluster.length - 1; // after virama, before final consonant
      assert.equal(insert(source, inside, inside, 'page'), null, cluster);
      assert.equal(insert(source, inside, inside, 'ruby'), null, cluster);
    }
  } finally {
    Intl.Segmenter = original;
  }
});

test('fallback preserves full Indic conjunct ruby and adjacent cluster boundaries', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    for (const cluster of conjuncts) {
      const source = '前' + cluster + '後';
      assert.deepEqual(insert(source, 1, 1 + cluster.length, 'ruby'), {
        value: '前｜' + cluster + '《よみ》後',
        selectionStart: cluster.length + 3,
        selectionEnd: cluster.length + 5,
      }, cluster);
      const adjacent = '前' + cluster + cluster + '後';
      assert.equal(insert(adjacent, 1 + cluster.length, 1 + cluster.length, 'page')?.value,
        '前' + cluster + '[[page]]' + cluster + '後');
    }
  } finally {
    Intl.Segmenter = original;
  }
});
