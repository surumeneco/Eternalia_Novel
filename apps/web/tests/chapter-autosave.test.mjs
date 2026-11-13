import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chapterRecoveryKey, chapterRecoveryMatches, parseChapterRecovery, isAutosaveRevisionConflict } from '../app/utils/chapter-autosave.ts';

const original = {
  version: 1, nodeId: 'chapter-A', baseRevision: 6, savedAt: 1790000000,
  title: '章-一', pages: ['｜王《おう》の話', '次の頁\n🌱'], details: { memo: '作業中' },
};

test('recovery is restricted to the current chapter and copies the ordered page array', () => {
  assert.equal(chapterRecoveryKey('chapter-A'), 'eternalia:chapter-recovery:chapter-A');
  const recovered = parseChapterRecovery(JSON.stringify(original), 'chapter-A');
  assert.deepEqual(recovered, original);
  assert.notEqual(recovered.pages, original.pages);
  assert.equal(parseChapterRecovery(JSON.stringify(original), 'chapter-B'), null);
  assert.equal(chapterRecoveryMatches(recovered, original), true);
  assert.equal(chapterRecoveryMatches(recovered, { ...original, pages: ['次の頁\n🌱','｜王《おう》の話'] }), false);
});

test('corrupt or oversized recovery does not become an editor draft', () => {
  for (const input of ['{', 'null', '{}', '[]', JSON.stringify({ ...original, version: 3 }),
    JSON.stringify({ ...original, pages: [] }), JSON.stringify({ ...original, pages: ['a'.repeat(100001)] }),
    JSON.stringify({ ...original, details: { memo: { nested: 'no' } } }),
    JSON.stringify({ ...original, baseRevision: -1 })]) {
    assert.equal(parseChapterRecovery(input, 'chapter-A'), null, input.slice(0, 100));
  }
});

test('only conflict responses trigger the no-silent-overwrite path', () => {
  assert.equal(isAutosaveRevisionConflict({ statusCode: 409 }), true);
  assert.equal(isAutosaveRevisionConflict({ response: { status: 409 } }), true);
  assert.equal(isAutosaveRevisionConflict({ statusCode: 503 }), false);
  assert.equal(isAutosaveRevisionConflict(new Error('network down')), false);
});
