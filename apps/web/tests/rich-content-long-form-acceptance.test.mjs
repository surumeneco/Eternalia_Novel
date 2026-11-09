// Exploratory losslessness checks for the reader. Not a real Android / IME test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeRichContent } from '../app/utils/rich-content-tokenizer.ts';

const restore = tokens => tokens.map(token => token.reading === undefined
  ? token.base : `｜${token.base}《${token.reading}》`).join('');

test('20,000-character Japanese manuscript survives ruby/page rendering tokenization', () => {
  const body = '春夏秋冬'.repeat(5_000);
  const source = body.slice(0, 5_001) + '｜漢字《かんじ》' + body.slice(5_001, 12_001) +
    '[[page]]' + body.slice(12_001) + '｜𠮷《よし》';
  const pages = source.split('[[page]]');
  assert.equal(pages.length, 2);
  const tokensByPage = pages.map(tokenizeRichContent);
  assert.equal(tokensByPage.flat().filter(token => token.reading !== undefined).length, 2);
  assert.equal(tokensByPage.map(restore).join('[[page]]'), source);
});

test('adjacent ruby tokens remain separate and lossless', () => {
  const source = '前｜東京《とうきょう》｜大阪《おおさか》後';
  const tokens = tokenizeRichContent(source);
  assert.deepEqual(tokens, [
    { base: '前' }, { base: '東京', reading: 'とうきょう' },
    { base: '大阪', reading: 'おおさか' }, { base: '後' },
  ]);
  assert.equal(restore(tokens), source);
});

test('malformed ruby with nested delimiters or separated reading remains source text', () => {
  for (const source of [
    '前｜漢字《よ｜み》後', '前｜甲《よ\nみ》後', '前｜甲《》後',
    '前｜甲《よ\u2029み》後', '前｜甲《よみ》｜未閉鎖《後',
  ]) assert.equal(restore(tokenizeRichContent(source)), source);
});

test('Unicode emoji, combining kana and supplementary characters preserve code units', () => {
  const source = '👩‍💻🇯🇵か\u3099𠮷｜👩‍💻《しごと》👨‍👩‍👧‍👦';
  assert.deepEqual(tokenizeRichContent(source)[1], { base: '👩‍💻', reading: 'しごと' });
  assert.equal(restore(tokenizeRichContent(source)), source);
});

test('empty and plain line-separated manuscripts remain unchanged', () => {
  assert.deepEqual(tokenizeRichContent(''), []);
  const source = '第一行\r\n第二行\u0085第三行\u2028第四行\u2029末尾';
  assert.deepEqual(tokenizeRichContent(source), [{ base: source }]);
});
