import test from 'node:test';
import assert from 'node:assert/strict';
import { insertManuscriptMarkup as insert } from '../app/utils/manuscript-markup.ts';

test('ruby wraps selected Japanese text and selects reading placeholder', () => {
  assert.deepEqual(insert('前漢字後', 1, 3, 'ruby'), {
    value: '前｜漢字《よみ》後', selectionStart: 5, selectionEnd: 7,
  });
});
test('ruby insertion without selection highlights the base placeholder', () => {
  assert.deepEqual(insert('前後', 1, 1, 'ruby'), {
    value: '前｜文字《よみ》後', selectionStart: 2, selectionEnd: 4,
  });
});
test('page marker inserts at selection start without deleting selected manuscript text', () => {
  assert.deepEqual(insert('朝昼夜', 1, 2, 'page'), {
    value: '朝[[page]]昼夜', selectionStart: 9, selectionEnd: 9,
  });
  assert.deepEqual(insert('第一行\n第二行', 0, 7, 'page'), {
    value: '[[page]]第一行\n第二行', selectionStart: 8, selectionEnd: 8,
  });
});
test('supplementary Unicode selection uses textarea UTF-16 offsets', () => {
  assert.deepEqual(insert('前𠮷後', 1, 3, 'ruby'), {
    value: '前｜𠮷《よみ》後', selectionStart: 5, selectionEnd: 7,
  });
});
test('unsupported inline markup and invalid selection are not silently rewritten', () => {
  assert.equal(insert('甲\n乙', 0, 3, 'ruby'), null);
  assert.equal(insert('｜甲《こう》', 0, 6, 'ruby'), null);
  assert.equal(insert('文', -1, 0, 'page'), null);
  assert.equal(insert('文', 0, 2, 'page'), null);
});

test('page marker cannot split a supplementary character', () => {
  assert.equal(insert('前𠮷後', 2, 2, 'page'), null);
});
test('ruby selection cannot split a surrogate pair', () => {
  assert.equal(insert('前𠮷後', 1, 2, 'ruby'), null);
  assert.equal(insert('前𠮷後', 2, 3, 'ruby'), null);
});
test('page marker outside the surrogate pair remains valid', () => {
  assert.equal(insert('前𠮷後', 3, 3, 'page')?.value, '前𠮷[[page]]後');
});

test('ruby rejects CR, CRLF and Unicode line/paragraph separators', () => {
  for (const separator of ['\r', '\r\n', '\u0085', '\u2028', '\u2029']) {
    const manuscript = '甲' + separator + '乙';
    assert.equal(insert(manuscript, 0, manuscript.length, 'ruby'), null);
  }
});

test('markup cannot split CRLF but remains valid immediately after it', () => {
  assert.equal(insert('甲\r\n乙', 2, 2, 'page'), null);
  assert.equal(insert('甲\r\n乙', 2, 2, 'ruby'), null);
  assert.equal(insert('甲\r\n乙', 3, 3, 'page')?.value, '甲\r\n[[page]]乙');
});

test('reserved page marker is never split or wrapped by ruby', () => {
  assert.equal(insert('甲[[page]]乙', 1, 9, 'ruby'), null);
  assert.equal(insert('甲[[page]]乙', 3, 3, 'ruby'), null);
  assert.equal(insert('甲[[page]]乙', 4, 4, 'page'), null);
  assert.equal(insert('甲[[page]]乙', 9, 9, 'page')?.value, '甲[[page]][[page]]乙');
});

test('existing ruby token boundaries are protected from nested insertion', () => {
  const source = '前｜漢字《かんじ》後';
  assert.equal(insert(source, 3, 3, 'page'), null);
  assert.equal(insert(source, 6, 6, 'ruby'), null);
  assert.equal(insert(source, 9, 9, 'page')?.value, '前｜漢字《かんじ》[[page]]後');
});


test('insertion preserves complete Unicode grapheme clusters', () => {
  if (typeof Intl.Segmenter !== 'function') return;
  for (const cluster of ['か\u3099', '👩‍💻', '🇯🇵']) {
    const source = '前' + cluster + '後';
    for (let offset = 2; offset < 1 + cluster.length; offset++) {
      if (new Intl.Segmenter('ja', { granularity: 'grapheme' })
        .segment(source).containing(offset)?.index === offset) continue;
      assert.equal(insert(source, offset, offset, 'page'), null, cluster);
      assert.equal(insert(source, offset, offset, 'ruby'), null, cluster);
    }
    assert.equal(insert(source, 1 + cluster.length, 1 + cluster.length, 'page')?.value,
      '前' + cluster + '[[page]]後');
    assert.equal(insert(source, 1, 1 + cluster.length, 'ruby')?.value,
      '前｜' + cluster + '《よみ》後');
  }
});

test('unknown runtime insertion kind does not silently create ruby', () => {
  assert.equal(insert('本文', 1, 1, 'unsupported'), null);
  assert.equal(insert('本文', 1, 1, 'page')?.value, '本[[page]]文');
  assert.equal(insert('本文', 1, 1, 'ruby')?.value, '本｜文字《よみ》文');
});

test('page marker preserves selection that extends into an existing ruby token', () => {
  const source = '前｜漢字《かんじ》後';
  assert.deepEqual(insert(source, 1, 4, 'page'), {
    value: '前[[page]]｜漢字《かんじ》後',
    selectionStart: 9, selectionEnd: 9,
  });
  assert.equal(insert(source, 1, 4, 'ruby'), null,
    'ruby replacement must still reject an endpoint inside a token');
});

test('page marker checks its insertion point, not the unused selection end', () => {
  assert.equal(insert('前𠮷後', 1, 2, 'page')?.value, '前[[page]]𠮷後');
  assert.equal(insert('前𠮷後', 2, 3, 'page'), null,
    'insertion itself must not split a supplementary character');
});
