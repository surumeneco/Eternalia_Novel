import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCatJUnit, validateCatTestPaths } from './run-cat-vitest-suite-junit.mjs';

const processId = 'eternalia.dictionary.spelling-collision';
const sample = (cases, total = cases.length) => `<testsuites tests="${total}" failures="1" errors="0"><testsuite>` +
  cases.map(([id, child = '']) => `<testcase classname="file.ts" name="${processId} CAT symbolic contract &gt; ${id}">${child}</testcase>`).join('') +
  '</testsuite></testsuites>';

test('CAT JUnit adapter alters testcase IDs only, preserving failure XML and counts', () => {
  const xml = sample([['case.a', '<failure message="actual failure">kept</failure>'], ['case.b']]);
  const result = normalizeCatJUnit(xml, processId, ['case.a', 'case.b']);
  assert.match(result, /name="case.a"/);
  assert.match(result, /name="case.b"/);
  assert.match(result, /<failure message="actual failure">kept<\/failure>/);
  assert.match(result, /tests="2" failures="1"/);
  assert.ok(!result.includes('CAT symbolic contract &gt;'));
});
test('CAT JUnit adapter refuses missing, duplicate, unexpected or non-CAT cases', () => {
  for (const xml of [sample([['case.a']]),sample([['case.a'],['case.a']]),sample([['case.a'],['case.c']]),sample([['case.a'],['case.b']],3),
    '<testsuites tests="2"><testcase name="case.a"/><testcase name="case.b"/></testsuites>']) {
    assert.throws(() => normalizeCatJUnit(xml, processId, ['case.a', 'case.b']));
  }
});

test('CAT JUnit adapter admits only declared generated test paths in contracts and Web', () => {
  const ids = ['case.a', 'case.b'];
  assert.doesNotThrow(() => validateCatTestPaths(['packages/contracts/tests/generated/cat_a.test.ts', 'apps/web/tests/generated/cat_b.test.ts'], ids));
  for (const paths of [[], ['apps/web/tests/../generated/cat_a.test.ts', 'apps/web/tests/generated/cat_b.test.ts'], ['apps/web/tests/generated/cat_a.test.ts', 'apps/web/tests/generated/cat_a.test.ts'], ['apps/web/tests/generated/other.test.ts', 'apps/web/tests/generated/cat_b.test.ts']]) {
    assert.throws(() => validateCatTestPaths(paths, ids));
  }
});
