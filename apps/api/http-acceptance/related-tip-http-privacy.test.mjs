/** ST-05/PB-05/PB-10/AC-06,31,69,70: related Tip projection through real HTTP. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const web = process.env.HTTP_BASE_URL;
const api = process.env.HTTP_API_URL;
const future = Date.parse('2099-07-08T00:15:00.000Z');
const roots = [web, api];

async function author(method, path, data) {
  const res = await fetch(web + path, {
    method,
    headers: {
      Origin: web, 'Content-Type': 'application/json',
      Cookie: 'eternalia_author=' + fixture.authorToken,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const body = await res.text();
  return { status: res.status, body, json: () => JSON.parse(body) };
}
async function node(id) {
  const result = await author('GET', '/api/admin/nodes');
  assert.equal(result.status, 200, result.body);
  const found = result.json().find(entry => entry.id === id);
  assert.ok(found, 'author node absent: ' + id);
  return found;
}
async function create(kind, parentId, title, details = {}) {
  const result = await author('POST', '/api/admin/nodes', {
    kind, parentId, content: { title, body: 'public:' + title, details },
  });
  assert.equal(result.status, 201, result.body);
  return result.json().id;
}
async function publish(id) {
  const n = await node(id);
  const result = await author('POST', '/api/admin/nodes/' + id + '/publish', {
    expectedRevision: n.revision,
  });
  assert.equal(result.status, 200, result.body);
}
async function visibility(id, publicSince, isPublic = true) {
  const n = await node(id);
  const result = await author('POST', '/api/admin/nodes/' + id + '/visibility', {
    expectedRevision: n.revision, isPublic, publicSince,
  });
  assert.equal(result.status, 200, result.body);
}
async function get(root, id) {
  const response = await fetch(root + '/api/public/items/' + id);
  const body = await response.text();
  return { status: response.status, body, json: () => JSON.parse(body) };
}

test('RELATED-HTTP-01/02/03/04: related Tip hides scheduled ancestors and unpublished titles in both public HTTP paths',
  { timeout: 120_000 }, async () => {
    assert.ok(web?.startsWith('http://127.0.0.1:'));
    assert.ok(api?.startsWith('http://127.0.0.1:'));
    const marker = fixture.prefix + '-related-http-';
    const publicTargetTitle = marker + 'target-published';
    const draftTitle = marker + 'target-DRAFT-SECRET';
    const draftBody = marker + 'body-DRAFT-SECRET';
    let seriesId;
    try {
      seriesId = await create('series', null, marker + 'series');
      const sourceCategoryId = await create('category', seriesId, marker + 'source-category');
      const targetCategoryId = await create('category', seriesId, marker + 'target-category');
      const targetId = await create('tip', targetCategoryId, publicTargetTitle);
      const sourceId = await create('tip', sourceCategoryId, marker + 'source',
        { relatedTipIds: JSON.stringify([targetId]) });
      for (const id of [seriesId, sourceCategoryId, targetCategoryId, targetId, sourceId]) {
        await publish(id);
      }

      async function assertPublicLink(title) {
        for (const root of roots) {
          const source = await get(root, sourceId);
          assert.equal(source.status, 200, 'source must stay published: ' + root);
          assert.equal(source.json().content.body, 'public:' + marker + 'source');
          const links = JSON.parse(source.json().content.details.relatedTips);
          assert.deepEqual(links, title === null ? [] : [{ id: targetId, title }]);
          if (title !== draftTitle) assert.ok(!source.body.includes(draftTitle), 'unpublished title leaked at ' + root);
          assert.ok(!source.body.includes(draftBody), 'unpublished body leaked at ' + root);
          if (title === null) assert.ok(!source.body.includes(targetId), 'hidden ID leaked at ' + root);
        }
      }

      await assertPublicLink(publicTargetTitle);
      const current = await node(targetId);
      const changed = await author('PATCH', '/api/admin/nodes/' + targetId, {
        expectedRevision: current.revision,
        content: { title: draftTitle, body: draftBody, details: {} },
      });
      assert.equal(changed.status, 200, changed.body);
      await assertPublicLink(publicTargetTitle);
      for (const root of roots) {
        const target = await get(root, targetId);
        assert.equal(target.status, 200);
        assert.equal(target.json().content.title, publicTargetTitle);
      }

      await visibility(targetId, future);
      await assertPublicLink(null);
      for (const root of roots) assert.equal((await get(root, targetId)).status, 404);
      await visibility(targetId, null);
      await assertPublicLink(publicTargetTitle);

      await visibility(targetCategoryId, future);
      await assertPublicLink(null);
      for (const root of roots) assert.equal((await get(root, targetId)).status, 404);
      await visibility(targetCategoryId, null);
      await assertPublicLink(publicTargetTitle);

      await publish(targetId);
      await assertPublicLink(draftTitle);
      for (const root of roots) {
        const target = await get(root, targetId);
        assert.equal(target.status, 200);
        assert.equal(target.json().content.body, draftBody);
      }
    } finally {
      // The runner uses a disposable DB; ensure this series cannot affect later readers.
      if (seriesId) {
        try { await visibility(seriesId, null, false); }
        catch { /* keep the primary test error */ }
      }
    }
  });
