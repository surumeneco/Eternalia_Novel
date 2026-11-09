import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeRichContent } from '../app/utils/rich-content-tokenizer.ts';

test('reader tokenizes ordinary inline ruby and surrounding text', () => {
  assert.deepEqual(tokenizeRichContent('前｜漢字《かんじ》後'), [
    { base: '前' }, { base: '漢字', reading: 'かんじ' }, { base: '後' },
  ]);
});

test('reader does not parse ruby spanning any supported line separator', () => {
  for (const separator of ['\n', '\r', '\r\n', '\u0085', '\u2028', '\u2029']) {
    const base = '前｜甲' + separator + '乙《よみ》後';
    const reading = '前｜漢字《よ' + separator + 'み》後';
    assert.deepEqual(tokenizeRichContent(base), [{ base }]);
    assert.deepEqual(tokenizeRichContent(reading), [{ base: reading }]);
  }
});

test('nested ruby delimiters are not consumed as part of a token', () => {
  assert.deepEqual(tokenizeRichContent('前｜甲｜乙《よみ》後'), [
    { base: '前｜甲' }, { base: '乙', reading: 'よみ' }, { base: '後' },
  ]);
  const invalid = '前｜漢字《よ｜み》後';
  assert.deepEqual(tokenizeRichContent(invalid), [{ base: invalid }]);
});
