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
test('page marker replaces selected text without affecting surrounding characters', () => {
  assert.deepEqual(insert('朝昼夜', 1, 2, 'page'), {
    value: '朝[[page]]夜', selectionStart: 9, selectionEnd: 9,
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
