// Exploratory tests; these are not CAT-generated test vectors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareEventsWithinPeriod, parseRelativeYear } from '../dist/index.js';

function event(id, year, order) {
  return { id, order, content: { title:id, details: year === null ? {} : {year} } };
}
test('relative years sort within the same period, including BCE-like negatives', () => {
  const items = [event('third','12',0), event('first','-8',2), event('second','0',1)];
  assert.deepEqual(items.sort(compareEventsWithinPeriod).map(e => e.id),
    ['first','second','third']);
});
test('undated events follow dated events; ties use explicit order', () => {
  const items = [event('unknown',null,0),event('b','5',4),event('a','5',1)];
  assert.deepEqual(items.sort(compareEventsWithinPeriod).map(e => e.id),['a','b','unknown']);
  assert.equal(parseRelativeYear('not a number'),null);
  assert.equal(parseRelativeYear(''),null);
  assert.equal(parseRelativeYear('1e6'),null,'do not infer an exponent-based year format');
});
