import test from 'node:test';
import assert from 'node:assert/strict';
import { insertManuscriptMarkup as insert } from '../app/utils/manuscript-markup.ts';

test('fallback preserves Japanese combining marks and emoji clusters without Segmenter', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    for (const [cluster, internal] of [
      ['か\u3099', [2]],
      ['👩‍💻', [3, 4]],
      ['👍🏽', [3]],
      ['🇯🇵', [3]],
    ]) {
      const source = '前' + cluster + '後';
      for (const offset of internal) {
        assert.equal(insert(source, offset, offset, 'page'), null, cluster);
        assert.equal(insert(source, offset, offset, 'ruby'), null, cluster);
      }
      assert.equal(insert(source, 1 + cluster.length, 1 + cluster.length, 'page')?.value,
        '前' + cluster + '[[page]]後');
    }
  } finally {
    Intl.Segmenter = original;
  }
});

test('fallback allows boundary between two complete flags', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    const source = '前🇯🇵🇺🇸後';
    assert.equal(insert(source, 3, 3, 'page'), null);
    assert.equal(insert(source, 7, 7, 'page'), null);
    assert.equal(insert(source, 5, 5, 'page')?.value, '前🇯🇵[[page]]🇺🇸後');
  } finally {
    Intl.Segmenter = original;
  }
});
