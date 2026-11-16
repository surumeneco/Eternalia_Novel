/**
 * AC-09 / LG-08: exploratory real-Nest + Nuxt proxy + PostgreSQL evidence.
 * This is deliberately separate from the four-state CAT-generated predicate
 * vectors and from real Discord OAuth / human-device acceptance.
 * The HTTP harness must set HTTP_ACCEPTANCE_DISPOSABLE_DB=1 and use an empty
 * disposable PostgreSQL database; no production data is used.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

assert.equal(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB, '1', 'disposable DB guard is required');
assert.notEqual(process.env.NODE_ENV, 'production');
const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const web = process.env.HTTP_BASE_URL;
const api = process.env.HTTP_API_URL;
assert.match(web ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);
assert.match(api ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);
const cookie = 'eternalia_author=' + fixture.authorToken;
const roots = [api, web];
const prefix = fixture.prefix + '-published-spelling-http';

async function request(root, method, path, data) {
  const response = await fetch(root + path, {
    method,
    redirect: 'manual',
    headers: { Cookie: cookie, Origin: web, 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const text = await response.text();
  let value;
  try { value = JSON.parse(text); } catch { value = text; }
  return { status: response.status, value, text };
}
async function create(root, kind, parentId, title) {
  const result = await request(root, 'POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: '', details: {} },
  });
  assert.equal(result.status, 201, result.text);
  assert.match(result.value.id, /^[0-9a-f-]{36}$/);
  return result.value.id;
}
async function publish(root, id, expectedRevision) {
  const result = await request(root, 'POST', '/api/admin/nodes/' + id + '/publish', { expectedRevision });
  assert.equal(result.status, 200, result.text);
}
async function edit(root, id, expectedRevision, title) {
  const result = await request(root, 'PATCH', '/api/admin/nodes/' + id, {
    expectedRevision, content: { title, body: '', details: {} },
  });
  assert.equal(result.status, 200, result.text);
}
async function visibility(root, id, expectedRevision, isPublic) {
  const result = await request(root, 'POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision, isPublic, publicSince: null,
  });
  assert.equal(result.status, 200, result.text);
}
async function authorWord(id) {
  const result = await request(api, 'GET', '/api/admin/nodes');
  assert.equal(result.status, 200, result.text);
  const word = result.value.find(node => node.id === id);
  assert.ok(word, 'missing author word ' + id);
  return word;
}
async function publicWord(id, expectedStatus = 200) {
  const response = await fetch(api + '/api/public/items/' + id);
  assert.equal(response.status, expectedStatus);
  return expectedStatus === 200 ? response.json() : null;
}
async function rejectCollision(root, method, parentOrWordId, title, expectedId, expectedRevision = 1) {
  const path = method === 'POST' ? '/api/admin/nodes' : '/api/admin/nodes/' + parentOrWordId;
  const payload = method === 'POST' ? {
    kind: 'word', parentId: parentOrWordId,
    content: { title, body: '', details: {} },
  } : { expectedRevision, content: { title, body: '', details: {} } };
  const result = await request(root, method, path, payload);
  assert.equal(result.status, 409, root + ' must reject the retained spelling: ' + result.text);
  assert.equal(result.value.code, 'duplicate-spelling');
  assert.equal(result.value.existingWordId, expectedId);
}

test('AC-09: an old published spelling remains reserved through draft rename and private visibility on both HTTP boundaries',
  { timeout: 120_000 }, async () => {
    const series = await create(api, 'series', null, prefix + '-series');
    const language = await create(api, 'language', series, prefix + '-language');
    const x = prefix + '-X';
    const y = prefix + '-Y';
    const word = await create(api, 'word', language, x);
    for (const id of [series, language, word]) await publish(api, id, 1);
    const alternate = await create(api, 'word', language, prefix + '-Z');

    await edit(api, word, 1, y);
    const before = await authorWord(word);
    assert.equal(before.revision, 2);
    assert.equal(before.draft.title, y);
    assert.equal(before.published.value.title, x);
    assert.equal((await publicWord(word)).content.title, x);

    for (const root of roots) {
      await rejectCollision(root, 'POST', language, x, word);
      await rejectCollision(root, 'POST', language, y, word);
      await rejectCollision(root, 'PATCH', alternate, x, word);
    }
    assert.deepEqual(await authorWord(word), before, '409 must not alter existing word or published snapshot');
    assert.equal((await authorWord(alternate)).draft.title, prefix + '-Z', '409 rename must be atomic');
    assert.equal((await publicWord(word)).content.title, x, 'draft edit must not republish');

    await visibility(api, word, 2, false);
    assert.equal((await authorWord(word)).published.value.title, x, 'private toggle must retain snapshot');
    await publicWord(word, 404);
    for (const root of roots) await rejectCollision(root, 'POST', language, x, word);

    // Explicit republication (not merely private toggle) releases old X.
    await publish(api, word, 3);
    assert.equal((await authorWord(word)).published.value.title, y);
    const nowAvailable = await create(api, 'word', language, x);
    await publish(api, nowAvailable, 1);
    assert.equal((await publicWord(nowAvailable)).content.title, x);
    // The old word's private status persists through the snapshot update.
    await publicWord(word, 404);
    await visibility(api, word, 3, true);
    assert.equal((await publicWord(word)).content.title, y);
  });

test('AC-09: valid soft deletion releases both draft and retained published spellings; another language is independent',
  { timeout: 120_000 }, async () => {
    const series = await create(api, 'series', null, prefix + '-deletion-series');
    const language = await create(api, 'language', series, prefix + '-deletion-language');
    const other = await create(api, 'language', series, prefix + '-other-language');
    const x = prefix + '-delete-X';
    const y = prefix + '-delete-Y';
    const word = await create(api, 'word', language, x);
    for (const id of [series, language, other, word]) await publish(api, id, 1);
    await edit(api, word, 1, y);
    const otherWord = await create(web, 'word', other, x);
    await publish(api, otherWord, 1);
    assert.equal((await publicWord(otherWord)).content.title, x);

    await visibility(api, word, 2, false);
    for (const root of roots) await rejectCollision(root, 'POST', language, x, word);
    const deleted = await request(api, 'POST', '/api/admin/nodes/' + word + '/soft-delete', {
      expectedRevision: 3,
    });
    assert.equal(deleted.status, 200, deleted.text);
    await publicWord(word, 404);
    const replacementX = await create(web, 'word', language, x);
    const replacementY = await create(api, 'word', language, y);
    assert.notEqual(replacementX, word);
    assert.notEqual(replacementY, word);
    assert.notEqual(replacementX, replacementY);
    await publish(api, replacementX, 1);
    await publish(api, replacementY, 1);
    assert.equal((await publicWord(replacementX)).content.title, x);
    assert.equal((await publicWord(replacementY)).content.title, y);
    assert.equal((await publicWord(otherWord)).content.title, x);
  });
