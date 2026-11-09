// Exploratory HTTP acceptance for author mutation request headers.
// These synthetic sessions are seeded in an explicitly disposable database;
// this is not real Discord OAuth, browser CSRF or normative CAT evidence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const web = process.env.HTTP_BASE_URL ?? 'http://127.0.0.1:3000';
const api = process.env.HTTP_API_URL ?? 'http://127.0.0.1:3001';
const roots = [web, api];

async function authorRead(root, path) {
  const response = await fetch(root + path, {
    headers: { Cookie: 'eternalia_author=' + fixture.authorToken },
  });
  assert.equal(response.status, 200, root + path + ' author precondition');
  return response.json();
}

// Every request is authenticated with the *valid* author fixture, so a 403
// establishes the header trust boundary rather than an invalid session.
const writes = [
  ['create node', 'POST', '/api/admin/nodes', {
    kind: 'series', content: { title: 'denied-header-series', body: '', details: {} },
  }],
  ['edit draft', 'PATCH', '/api/admin/nodes/' + fixture.chapter, {
    expectedRevision: 1,
    content: { title: 'denied-header-edit', body: 'not-persisted', details: {} },
  }],
  ['publish draft', 'POST', '/api/admin/nodes/' + fixture.chapter + '/publish', {
    expectedRevision: 1,
  }],
  ['change visibility', 'POST', '/api/admin/nodes/' + fixture.chapter + '/visibility', {
    expectedRevision: 1, isPublic: false, publicSince: null,
  }],
  ['reorder', 'POST', '/api/admin/order', {
    parentId: fixture.seriesA, kind: 'volume', orderedIds: [fixture.volume],
    expectedRevisions: { [fixture.volume]: 1 },
  }],
  ['create memo', 'POST', '/api/admin/memos', {
    title: 'denied-header-memo', body: 'not-persisted', tags: [],
  }],
];
const invalidHeaders = [
  ['missing Origin', undefined, 'application/json'],
  ['cross-site Origin', 'https://untrusted.invalid', 'application/json'],
  ['opaque Origin', 'null', 'application/json'],
  ['text/plain media type', web, 'text/plain'],
  ['missing media type', web, undefined],
];

test('registered author can still read private management data through both HTTP boundaries', async () => {
  assert.ok(fixture.authorToken, 'synthetic author token is required');
  for (const root of roots) {
    const nodes = await authorRead(root, '/api/admin/nodes');
    const memos = await authorRead(root, '/api/admin/memos');
    assert.ok(nodes.some(node => node.id === fixture.chapter), 'missing seeded chapter');
    assert.ok(Array.isArray(memos));
  }
});

test('invalid Origin/media type never mutates author state through Nest or Nuxt', async () => {
  const nodesBefore = await authorRead(api, '/api/admin/nodes');
  const memosBefore = await authorRead(api, '/api/admin/memos');
  const publicBefore = await fetch(api + '/api/public/items/' + fixture.chapter);
  assert.equal(publicBefore.status, 200);
  const publicBodyBefore = await publicBefore.text();

  for (const root of roots) {
    for (const [headerCase, origin, contentType] of invalidHeaders) {
      for (const [operation, method, path, payload] of writes) {
        const headers = { Cookie: 'eternalia_author=' + fixture.authorToken };
        if (origin !== undefined) headers.Origin = origin;
        if (contentType !== undefined) headers['Content-Type'] = contentType;
        const response = await fetch(root + path, {
          method, headers, body: Buffer.from(JSON.stringify(payload)),
          redirect: 'manual',
        });
        assert.equal(response.status, 403,
          `${root} ${operation}: ${headerCase} must reject a valid author session`);
      }
    }
  }

  assert.deepEqual(await authorRead(api, '/api/admin/nodes'), nodesBefore,
    'denied writes must not change any draft or revision');
  assert.deepEqual(await authorRead(api, '/api/admin/memos'), memosBefore,
    'denied writes must not create a memo');
  const publicAfter = await fetch(api + '/api/public/items/' + fixture.chapter);
  assert.equal(publicAfter.status, 200);
  assert.equal(await publicAfter.text(), publicBodyBefore,
    'denied writes must not alter published snapshots');
});
