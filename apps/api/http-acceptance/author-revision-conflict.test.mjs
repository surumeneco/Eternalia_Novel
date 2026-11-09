// Exploratory HTTP/PostgreSQL verification of the existing alpha revision
// contract. Synthetic author session, not real Discord OAuth/CSRF acceptance.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const web = process.env.HTTP_BASE_URL ?? 'http://127.0.0.1:3000';
const api = process.env.HTTP_API_URL ?? 'http://127.0.0.1:3001';

async function request(root, method, path, body) {
  const response = await fetch(root + path, {
    method,
    headers: {
      Cookie: 'eternalia_author=' + fixture.authorToken,
      Origin: web,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: 'manual',
  });
  return { status: response.status, body: await response.text() };
}
async function readManagedNodes() {
  const result = await request(api, 'GET', '/api/admin/nodes');
  assert.equal(result.status, 200, 'the synthetic author session must be valid');
  return JSON.parse(result.body);
}
async function createSeries() {
  const content = { title: '競合検査-' + randomUUID(), body: 'initial draft', details: {} };
  const response = await request(api, 'POST', '/api/admin/nodes', { kind: 'series', content });
  assert.equal(response.status, 201, response.body);
  return { id: JSON.parse(response.body).id, content };
}
async function publicItem(id) {
  const result = await fetch(api + '/api/public/items/' + id, { redirect: 'manual' });
  return { status: result.status, body: await result.text() };
}

test('two simultaneous edits through Nest and Nuxt have one winner and one revision conflict', async () => {
  const { id } = await createSeries();
  const attempts = [
    { root: api, title: 'direct-writer', body: 'direct draft' },
    { root: web, title: 'proxy-writer', body: 'proxy draft' },
  ];
  const replies = await Promise.all(attempts.map(({ root, title, body }) =>
    request(root, 'PATCH', '/api/admin/nodes/' + id, {
      expectedRevision: 1, content: { title, body, details: {} },
    })));
  assert.deepEqual(replies.map(r => r.status).sort(), [200, 409],
    'one stale write must be rejected even across HTTP entrypoints');
  const winningIndex = replies.findIndex(r => r.status === 200);
  const stored = (await readManagedNodes()).find(node => node.id === id);
  assert.equal(stored?.revision, 2, 'the winner must advance the revision exactly once');
  assert.equal(stored.draft.title, attempts[winningIndex].title);
  assert.equal(stored.draft.body, attempts[winningIndex].body);
  assert.equal((await publicItem(id)).status, 404,
    'saving a winning draft must not implicitly publish it');
});

test('stale publication and visibility requests do not alter a published snapshot', async () => {
  const { id } = await createSeries();
  const edit = await request(web, 'PATCH', '/api/admin/nodes/' + id, {
    expectedRevision: 1,
    content: { title: '公開候補', body: 'published revision two', details: {} },
  });
  assert.equal(edit.status, 200, edit.body);
  const stalePublish = await request(api, 'POST', '/api/admin/nodes/' + id + '/publish', {
    expectedRevision: 1,
  });
  assert.equal(stalePublish.status, 409, stalePublish.body);
  assert.equal((await publicItem(id)).status, 404, 'a stale publish must not reveal drafts');

  const publish = await request(web, 'POST', '/api/admin/nodes/' + id + '/publish', {
    expectedRevision: 2,
  });
  assert.equal(publish.status, 200, publish.body);
  const publishedBefore = await publicItem(id);
  assert.equal(publishedBefore.status, 200, publishedBefore.body);
  assert.equal(JSON.parse(publishedBefore.body).content.body, 'published revision two');

  const nextDraft = await request(api, 'PATCH', '/api/admin/nodes/' + id, {
    expectedRevision: 2,
    content: { title: '非公開改訂', body: 'unpublished revision three', details: {} },
  });
  assert.equal(nextDraft.status, 200, nextDraft.body);
  assert.equal((await readManagedNodes()).find(node => node.id === id)?.revision, 3);
  const beforeRejectedWrites = (await readManagedNodes()).find(node => node.id === id);
  for (const root of [api, web]) {
    const staleVisibility = await request(root, 'POST', '/api/admin/nodes/' + id + '/visibility', {
      expectedRevision: 2, isPublic: false, publicSince: null,
    });
    assert.equal(staleVisibility.status, 409, root + ': stale visibility');
    const staleRepublish = await request(root, 'POST', '/api/admin/nodes/' + id + '/publish', {
      expectedRevision: 2,
    });
    assert.equal(staleRepublish.status, 409, root + ': stale publication');
  }
  assert.deepEqual((await readManagedNodes()).find(node => node.id === id), beforeRejectedWrites,
    'stale operations must not change draft, revision, schedule or visibility');
  assert.deepEqual(await publicItem(id), publishedBefore,
    'unpublished draft and stale requests must not change the published projection');
});
