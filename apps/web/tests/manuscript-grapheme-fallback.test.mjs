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

test('fallback does not split a subdivision-flag emoji tag sequence', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    const flag = '🏴' + String.fromCodePoint(
      0xE0067, 0xE0062, 0xE0065, 0xE006E, 0xE0067, 0xE007F,
    );
    const source = '前' + flag + '後';
    for (let offset = 2; offset < 1 + flag.length; offset++) {
      assert.equal(insert(source, offset, offset, 'page'), null, 'offset ' + offset);
      assert.equal(insert(source, offset, offset, 'ruby'), null, 'offset ' + offset);
    }
    assert.equal(insert(source, 1 + flag.length, 1 + flag.length, 'page')?.value,
      '前' + flag + '[[page]]後');
  } finally {
    Intl.Segmenter = original;
  }
});

test('fallback preserves halfwidth kana voiced and semi-voiced clusters', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    for (const cluster of ['ｶﾞ', 'ﾊﾟ']) {
      const source = '前' + cluster + '後';
      assert.equal(insert(source, 2, 2, 'page'), null, cluster);
      assert.equal(insert(source, 2, 2, 'ruby'), null, cluster);
      assert.equal(insert(source, 3, 3, 'page')?.value,
        '前' + cluster + '[[page]]後');
    }
  } finally {
    Intl.Segmenter = original;
  }
});

test('fallback preserves Hangul Jamo syllable clusters', () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    const jamo = '前각後';
    for (const index of [2, 3]) {
      assert.equal(insert(jamo, index, index, 'page'), null, 'Jamo ' + index);
      assert.equal(insert(jamo, index, index, 'ruby'), null, 'Jamo ' + index);
    }
    assert.equal(insert(jamo, 4, 4, 'page')?.value, '前각[[page]]後');
    const lv = '前각後';
    assert.equal(insert(lv, 2, 2, 'page'), null, 'LV + T');
    assert.equal(insert(lv, 3, 3, 'page')?.value, '前각[[page]]後');
    const adjacent = '前각나後';
    assert.equal(insert(adjacent, 4, 4, 'page')?.value, '前각[[page]]나後');
  } finally {
    Intl.Segmenter = original;
  }
});
