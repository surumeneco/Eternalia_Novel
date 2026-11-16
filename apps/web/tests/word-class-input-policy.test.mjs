import test from 'node:test';
import assert from 'node:assert/strict';
import { wordClassInputPolicy } from '../app/utils/word-class-input-policy.ts';

test('LG-05: author POS choices require a language master; free text never becomes enabled', () => {
  for (const hasEntries of [false, true]) for (const hasLegacy of [false, true]) {
    const result = wordClassInputPolicy(hasEntries, hasLegacy);
    assert.deepEqual(result, { choiceEnabled: hasEntries, showLegacy: hasLegacy, freeTextAllowed: false });
  }
});
