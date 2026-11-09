/**
 * Real Chromium/form-origin and OAuth-handshake boundary acceptance.
 * Uses an isolated PostgreSQL fixture with a synthetic author cookie.
 * Does not contact Discord or claim real OAuth user verification.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const web = process.env.HTTP_BASE_URL;
const api = process.env.HTTP_API_URL;
assert.ok(web?.startsWith('http://127.0.0.1:'), 'a loopback web origin is required');
assert.ok(api?.startsWith('http://127.0.0.1:'), 'a loopback API origin is required');

async function authorRead(path) {
  const response = await fetch(api + path, {
    headers: { Cookie: 'eternalia_author=' + fixture.authorToken },
  });
  assert.equal(response.status, 200, 'valid synthetic author precondition ' + path);
  return response.json();
}
async function publicSnapshot() {
  const response = await fetch(api + '/api/public/items/' + fixture.chapter);
  assert.equal(response.status, 200, 'published chapter fixture precondition');
  return response.text();
}

test('Chromium cross-origin HTML forms carry a valid author cookie but cannot write or log out',
  { timeout: 90_000 }, async () => {
    const nodesBefore = await authorRead('/api/admin/nodes');
    const memosBefore = await authorRead('/api/admin/memos');
    const publishedBefore = await publicSnapshot();
    const attacker = createServer((_req, response) => {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<!doctype html><title>Origin boundary fixture</title>' +
        '<iframe name="sink"></iframe>' +
        '<form id="attack" target="sink" method="POST" enctype="application/x-www-form-urlencoded">' +
        '<input name="payload" value="cross-origin-form"></form>');
    });
    const browser = await chromium.launch({ headless: true });
    try {
      attacker.listen(0, '127.0.0.1');
      await once(attacker, 'listening');
      const address = attacker.address();
      assert.ok(address && typeof address === 'object');
      const evilOrigin = 'http://127.0.0.1:' + address.port;
      assert.notEqual(evilOrigin, web);
      assert.notEqual(evilOrigin, api);
      const context = await browser.newContext();
      try {
        await context.addCookies([{
          name: 'eternalia_author', value: fixture.authorToken,
          url: web, httpOnly: true, sameSite: 'Lax',
        }]);
        const page = await context.newPage();
        await page.goto(evilOrigin);
        // Cross-port form posts are cross-origin but same-site: the Lax cookie
        // is still attached. This specifically probes the server Origin gate.
        for (const root of [api, web]) {
          for (const path of ['/api/admin/nodes', '/api/auth/logout']) {
            const target = root + path;
            const responsePromise = page.waitForResponse(response =>
              response.url() === target && response.request().method() === 'POST',
            { timeout: 15_000 });
            await page.locator('#attack').evaluate((form, url) => {
              form.action = url;
              form.submit();
            }, target);
            const response = await responsePromise;
            const headers = await response.request().allHeaders();
            assert.equal(headers.origin, evilOrigin, 'Chromium must send the attacker Origin');
            assert.ok(headers.cookie?.includes('eternalia_author='),
              'Chromium must actually attach the valid HttpOnly session cookie');
            assert.equal(response.status(), 403,
              'server must deny a browser cross-origin form: ' + target);
          }
        }
        const stillAuthor = await context.request.get(web + '/api/auth/me');
        assert.equal(stillAuthor.status(), 200);
        assert.equal((await stillAuthor.json()).authenticated, true,
          'the CSRF logout attempts must not revoke the genuine session');
      } finally {
        await context.close();
      }
    } finally {
      await browser.close();
      await new Promise(resolve => attacker.close(resolve));
    }
    assert.deepEqual(await authorRead('/api/admin/nodes'), nodesBefore,
      'a browser CSRF form must not change author draft or visibility');
    assert.deepEqual(await authorRead('/api/admin/memos'), memosBefore,
      'a browser CSRF form must not change private memos');
    assert.equal(await publicSnapshot(), publishedBefore,
      'a browser CSRF form must not change the published projection');
  });

test('Discord authorization starts with PKCE/state and rejects malformed callbacks before token exchange',
  { timeout: 30_000 }, async () => {
    const login = await fetch(web + '/api/auth/discord', { redirect: 'manual' });
    assert.equal(login.status, 302, 'OAuth start must redirect rather than issue a local login');
    const location = new URL(login.headers.get('location') ?? '');
    assert.equal(location.origin, 'https://discord.com');
    assert.equal(location.pathname, '/oauth2/authorize');
    assert.equal(location.searchParams.get('response_type'), 'code');
    assert.equal(location.searchParams.get('scope'), 'identify');
    assert.equal(location.searchParams.get('client_id'), '123456789012345678');
    assert.equal(location.searchParams.get('redirect_uri'), web + '/api/auth/discord/callback');
    assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
    assert.match(location.searchParams.get('code_challenge') ?? '', /^[A-Za-z0-9_-]{43}$/);
    const state = location.searchParams.get('state') ?? '';
    assert.match(state, /^[a-f0-9]{64}$/);
    const cookie = login.headers.get('set-cookie') ?? '';
    assert.ok(cookie.startsWith('eternalia_oauth_state=' + state + ';'),
      'the OAuth cookie must contain the matching opaque state');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /Path=\/api\/auth\/discord\/callback/i);
    const oauthCookie = 'eternalia_oauth_state=' + state;
    const invalidRequests = [
      { reason: 'state cookie absent', cookie: '', state, code: 'never-exchange' },
      { reason: 'wrong state', cookie: oauthCookie, state: '0'.repeat(64), code: 'never-exchange' },
      { reason: 'missing code', cookie: oauthCookie, state, code: '' },
      { reason: 'untrusted issuer', cookie: oauthCookie, state, code: 'never-exchange', iss: 'https://malicious.invalid' },
    ];
    for (const root of [api, web]) {
      for (const item of invalidRequests) {
        const url = new URL(root + '/api/auth/discord/callback');
        url.searchParams.set('state', item.state);
        if (item.code) url.searchParams.set('code', item.code);
        if (item.iss) url.searchParams.set('iss', item.iss);
        const response = await fetch(url, {
          redirect: 'manual',
          headers: item.cookie ? { Cookie: item.cookie } : {},
        });
        assert.equal(response.status, 401, root + ' must reject ' + item.reason);
        assert.ok(!(response.headers.get('set-cookie') ?? '').includes('eternalia_author='),
          'invalid OAuth must not mint an author cookie');
      }
    }
    const unauthenticated = await fetch(api + '/api/auth/me');
    assert.equal(unauthenticated.status, 200);
    assert.equal((await unauthenticated.json()).authenticated, false);
  });
