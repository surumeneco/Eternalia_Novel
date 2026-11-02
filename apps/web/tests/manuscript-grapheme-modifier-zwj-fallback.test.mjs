import test from 'node:test';
import assert from 'node:assert/strict';
import { insertManuscriptMarkup as insert } from '../app/utils/manuscript-markup.ts';

test('fallback treats skin-tone ZWJ sequences as single editable graphemes', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    for (const cluster of ['👩🏽‍💻', '🧑🏽‍🤝‍🧑🏼']) {
      const source = '前' + cluster + '後';
      for (let offset = 2; offset < 1 + cluster.length; offset++) {
        assert.equal(insert(source, offset, offset, 'page'), null, cluster + ':' + offset);
        assert.equal(insert(source, offset, offset, 'ruby'), null, cluster + ':' + offset);
      }
      assert.equal(insert(source, 1 + cluster.length, 1 + cluster.length, 'page')?.value,
        '前' + cluster + '[[page]]後');
      assert.deepEqual(insert(source, 1, 1 + cluster.length, 'ruby'), {
        value: '前｜' + cluster + '《よみ》後',
        selectionStart: cluster.length + 3,
        selectionEnd: cluster.length + 5,
      });
    }
  } finally {
    Intl.Segmenter = original;
  }
});
