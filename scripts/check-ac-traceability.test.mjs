import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyAcTraceability } from './check-ac-traceability.mjs';

function matrix(overrides = {}) {
  const rows = Array.from({length: 78}, (_, idx) => {
    const id = `AC-${String(idx + 1).padStart(2, '0')}`;
    return `| ${id} | Scenario ${id} | apps/web/tests/alpha.test.mjs | Synthetic only | not-run |`;
  });
  for (const [key, value] of Object.entries(overrides)) {
    const index = Number(key) - 1;
    if (value === null) rows.splice(index, 1);
    else rows[index] = value;
  }
  return [
    '# α受入台帳',
    '| AC | 受入シナリオ | コード/テスト箇所 | 現在の部分証拠 | AC全体の判定 |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

test('all 78 AC rows in canonical order with explicit not-run are valid, but not passed', () => {
  const result = verifyAcTraceability(matrix());
  assert.deepEqual(result.errors, []);
  assert.equal(result.counts['not-run'], 78);
  assert.equal(result.counts.pass, 0);
  assert.equal(result.checked, 78);
});

test('missing AC ID is an error, never filled in from unrelated prose', () => {
  const result = verifyAcTraceability(matrix({12: null}) + '\nAC-12 is mentioned in a note');
  assert.ok(result.errors.some(error => /missing AC-12/.test(error)));
});

test('duplicate AC IDs and order swaps are both errors', () => {
  const result = verifyAcTraceability(matrix({15:'| AC-14 | Duplicate | test.mjs | CI 1 | not-run |'}));
  assert.ok(result.errors.some(error => /duplicate AC-14/.test(error)));
  assert.ok(result.errors.some(error => /missing AC-15/.test(error)));
});

test('unrecognized and incomplete statuses never silently count as evidence', () => {
  const result = verifyAcTraceability(matrix({3:'| AC-03 | A | B | C | done |'}));
  assert.ok(result.errors.some(error => /invalid status.*done/.test(error)));
});

test('pass requires concrete test, exact-head SHA and CI execution evidence, not merely a green adjective', () => {
  const result = verifyAcTraceability(matrix({4:'| AC-04 | A | — | CI green | pass |'}));
  assert.ok(result.errors.some(error => /AC-04 pass claim lacks/.test(error)));
});

test('a structurally broken Markdown row is rejected', () => {
  const result = verifyAcTraceability(matrix({9:'| AC-09 | Broken | not-run |'}));
  assert.ok(result.errors.some(error => /AC-09 has 3 columns/.test(error)));
});

test('a full pass claim with test source, exact commit and CI link passes structural validation only', () => {
  const sha = 'a'.repeat(40);
  const row = `| AC-78 | A | apps/web/tests/alpha.test.mjs | HEAD ${sha}; https://github.com/surumeneco/Eternalia_Novel/actions/runs/123456 | pass |`;
  const result = verifyAcTraceability(matrix({78:row}));
  assert.deepEqual(result.errors, []);
  assert.equal(result.counts.pass, 1);
});
