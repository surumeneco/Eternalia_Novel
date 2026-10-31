import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishedChapterSequence } from '../app/utils/chapter-navigation.ts';

function node(id, kind, parentId, order = 0, title = id) {
  return {
    id, kind, parentId, order,
    content: { title, body: '', details: {} },
    publishedAt: 1_800_000_000_000,
  };
}
test('reader navigation continues through the next Part and Volume', () => {
  const items = [
    node('chapter-b', 'chapter', 'part-a', 1),
    node('volume-b', 'volume', 'series-a', 1),
    node('chapter-c', 'chapter', 'part-b', 0),
    node('chapter-d', 'chapter', 'part-c', 0),
    node('series-a', 'series', null),
    node('part-c', 'part', 'volume-b'),
    node('part-b', 'part', 'volume-a', 1),
    node('chapter-a', 'chapter', 'part-a', 0),
    node('part-a', 'part', 'volume-a', 0),
    node('volume-a', 'volume', 'series-a', 0),
  ];
  assert.deepEqual(publishedChapterSequence(items, 'series-a').map(item => item.id),
    ['chapter-a', 'chapter-b', 'chapter-c', 'chapter-d']);
});

test('only the supplied public tree participates; hidden paths and foreign series cannot appear', () => {
  const publicItems = [
    node('series-a', 'series', null),
    node('series-b', 'series', null),
    node('volume-a', 'volume', 'series-a'),
    node('part-a', 'part', 'volume-a'),
    node('chapter-visible', 'chapter', 'part-a'),
    node('chapter-foreign', 'chapter', 'part-other'),
    node('volume-other', 'volume', 'series-b'),
    node('part-other', 'part', 'volume-other'),
  ];
  assert.deepEqual(publishedChapterSequence(publicItems, 'series-a').map(item => item.id),
    ['chapter-visible']);
  assert.deepEqual(publishedChapterSequence(publicItems, 'unknown'), []);
  assert.deepEqual(publishedChapterSequence(publicItems, 'series-b').map(item => item.id),
    ['chapter-foreign']);
});

test('chapter ordering is deterministic for equal explicit positions', () => {
  const items = [
    node('series', 'series', null),
    node('volume', 'volume', 'series'),
    node('part', 'part', 'volume'),
    node('b', 'chapter', 'part', 0, 'い'),
    node('a', 'chapter', 'part', 0, 'あ'),
  ];
  assert.deepEqual(publishedChapterSequence(items, 'series').map(item => item.id), ['a', 'b']);
  assert.deepEqual(publishedChapterSequence([...items].reverse(), 'series').map(item => item.id), ['a', 'b']);
});
