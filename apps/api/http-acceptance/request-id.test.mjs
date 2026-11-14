/** AC-71 (partial): request tracing without changing existing JSON API payloads. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const api = process.env.HTTP_API_URL;
const web = process.env.HTTP_BASE_URL;
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test('API-REQUEST-ID-01/02/03: Nest and Nuxt API proxy return server-owned IDs on successful and denied requests',
  { timeout: 60_000 }, async () => {
    assert.ok(api?.startsWith('http://127.0.0.1:'));
    assert.ok(web?.startsWith('http://127.0.0.1:'));
    const allIds = new Set();
    for (const root of [api, web]) {
      for (const [path, expectedStatus] of [
        ['/api/public/series', 200],
        ['/api/admin/nodes', 401],
        ['/api/public/items/' + fixture.unpublishedTip, 404],
      ]) {
        const forged = 'external-attacker-controlled-id';
        const response = await fetch(root + path, {
          redirect: 'manual',
          headers: { 'X-Request-Id': forged },
        });
        assert.equal(response.status, expectedStatus, root + path);
        const requestId = response.headers.get('x-request-id');
        assert.match(requestId ?? '', uuidV4, 'invalid request ID for ' + root + path);
        assert.notEqual(requestId, forged, 'untrusted supplied ID must not be reflected');
        assert.equal(allIds.has(requestId), false, 'ID must not be reused across requests');
        allIds.add(requestId);
        assert.match(response.headers.get('cache-control') ?? '', /no-store/i);
        const body = await response.json();
        if (expectedStatus === 200) {
          assert.ok(Array.isArray(body), 'success API JSON array contract must stay unchanged');
          assert.ok(body.some(node => node.id === fixture.seriesA));
        } else {
          assert.equal(body.statusCode, expectedStatus, 'Nest error JSON contract must stay unchanged');
          assert.ok(!JSON.stringify(body).includes(fixture.prefix + '-unpublished-tip'),
            'the forbidden title must not be included in an error');
        }
      }
      // Successive calls to the *same* resource cannot reuse an earlier ID.
      const again = await fetch(root + '/api/public/series');
      const extraId = again.headers.get('x-request-id');
      assert.match(extraId ?? '', uuidV4);
      assert.equal(allIds.has(extraId), false);
      allIds.add(extraId);
    }
    assert.equal(allIds.size, 8);
  });
