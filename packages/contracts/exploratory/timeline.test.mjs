// Exploratory tests; these are not CAT-generated test vectors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareEventsWithinPeriod, parseRelativeYear, commonTimelineYear, compareUnifiedTimelineEntries } from '../dist/index.js';

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

test('EPOCH-01/02: a period zero is an additive common-axis offset, not an implicit default', () => {
  assert.equal(commonTimelineYear('100', '-90'), 10);
  assert.equal(commonTimelineYear('-15', '25'), 10);
  assert.equal(commonTimelineYear('0', '0'), 0);
  assert.equal(commonTimelineYear('-200', '0'), -200);
  assert.equal(commonTimelineYear(undefined, '1'), null);
  assert.equal(commonTimelineYear('', '1'), null);
  assert.equal(commonTimelineYear('1', undefined), null);
  assert.equal(commonTimelineYear('1e2', '1'), null);
  assert.equal(commonTimelineYear('9007199254740991', '1'), null, 'overflow must not silently reorder');
});

test('EPOCH-03: chronological merge is deterministic across periods and same-year events', () => {
  const periodA = { id:'a', order:2, content:{title:'A', details:{relativeYears:'0'}} };
  const periodB = { id:'b', order:1, content:{title:'B', details:{relativeYears:'100'}} };
  const entries = [
    { period:periodA, event:event('newer', '12', 1), commonYear:12 },
    { period:periodA, event:event('same-a', '10', 0), commonYear:10 },
    { period:periodB, event:event('same-b2', '-90', 2), commonYear:10 },
    { period:periodB, event:event('same-b1', '-90', 1), commonYear:10 },
    { period:periodB, event:event('older', '-110', 0), commonYear:-10 },
  ];
  assert.deepEqual(entries.sort(compareUnifiedTimelineEntries).map(x=>x.event.id),
    ['older','same-b1','same-b2','same-a','newer']);
});
