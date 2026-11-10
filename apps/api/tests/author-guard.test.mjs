// Exploratory unit checks, not real Discord OAuth2 browser authorization.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { AuthorGuard } = require('../dist/author.guard.js');

function context(method,headers) {
  return { switchToHttp: () => ({ getRequest: () => ({method,headers}) }) };
}
test('anonymous author operations are always rejected', async () => {
  const auth = { isAuthor: async () => false, assertWriteOrigin: () => {} };
  const guard = new AuthorGuard(auth);
  await assert.rejects(guard.canActivate(context('GET',{})));
  await assert.rejects(guard.canActivate(context('POST',{})));
});
test('author mutations must be subject to the origin policy', async () => {
  let checked = 0;
  const auth = { isAuthor: async () => true, assertWriteOrigin: () => {checked++;} };
  const guard = new AuthorGuard(auth);
  await guard.canActivate(context('GET',{}));
  assert.equal(checked,0);
  await guard.canActivate(context('POST',{}));
  assert.equal(checked,1);
});

test('PATCH and DELETE require write Origin while HEAD does not', async () => {
  let checks = 0;
  const guard = new AuthorGuard({
    isAuthor: async () => true,
    assertWriteOrigin: () => { checks++; },
  });
  await guard.canActivate(context('PATCH', {}));
  await guard.canActivate(context('DELETE', {}));
  assert.equal(checks, 2);
  await guard.canActivate(context('HEAD', {}));
  assert.equal(checks, 2);
});

test('actual DiscordAuthService requires exact JSON media type and matching Origin', () => {
  const { DiscordAuthService } = require('../dist/discord-auth.service.js');
  // Use the real production method without opening a DB connection.
  const auth = Object.create(DiscordAuthService.prototype);
  Object.assign(auth, {
    pool: {}, clientId: 'test-client', clientSecret: 'test-secret',
    authorId: '123456789012345678', origin: 'https://example.test',
  });
  assert.equal(auth.configured, true);
  const headers = value => ({ origin: 'https://example.test', 'content-type': value });
  for (const invalid of [
    'application/jsonp', 'application/json-seq',
    'application/json-malformed', 'text/plain', '', undefined,
    'application/json; charset=utf-8, text/plain',
    'application/json; charset=utf-8, application/x-www-form-urlencoded',
  ]) assert.throws(() => auth.assertWriteOrigin(headers(invalid)),
    undefined, 'unexpectedly accepted ' + invalid);
  for (const valid of ['application/json', 'Application/JSON; charset=utf-8'])
    assert.doesNotThrow(() => auth.assertWriteOrigin(headers(valid)), valid);
  assert.throws(() => auth.assertWriteOrigin({
    origin: 'https://attacker.test', 'content-type': 'application/json',
  }));
});

test('Discord author configuration accepts only canonical HTTP origins', () => {
  const { DiscordAuthService } = require('../dist/discord-auth.service.js');
  const auth = Object.create(DiscordAuthService.prototype);
  Object.assign(auth, {
    pool: {}, clientId: 'test-client', clientSecret: 'test-secret',
    authorId: '123456789012345678', origin: '',
  });
  for (const origin of [
    'https://example.test', 'http://127.0.0.1:3000', 'http://[::1]:3000',
  ]) {
    auth.origin = origin;
    assert.equal(auth.configured, true, origin);
  }
  for (const origin of [
    'https://example.test?next=evil', 'https://example.test#fragment',
    'https://user@example.test', 'https://example.test/path',
    'https://example.test/',
    // URL.origin canonicalizes host case and strips default ports.
    // APP_ORIGIN must be the exact canonical value, not a normalized alias.
    'https://EXAMPLE.test', 'https://example.test:443',
    'http://127.0.0.1:80',
  ]) {
    auth.origin = origin;
    assert.equal(auth.configured, false, origin);
  }
});

test('OAuth callback rejects invalid state, issuer and code before consuming DB state', async () => {
  const { DiscordAuthService } = require('../dist/discord-auth.service.js');
  let consumed = 0;
  const auth = Object.create(DiscordAuthService.prototype);
  Object.assign(auth, {
    pool: { query: async () => { consumed++; return { rows: [] }; } },
    clientId: 'test-client', clientSecret: 'test-secret',
    authorId: '123456789012345678', origin: 'https://example.test',
  });
  const state = 'a'.repeat(64);
  const validHeaders = { cookie: 'eternalia_oauth_state=' + state };
  const validQuery = { state, code: 'one-time-code', iss: 'https://discord.com' };
  const cases = [
    [{}, validQuery],
    [{ cookie: 'eternalia_oauth_state=' + 'b'.repeat(64) }, validQuery],
    [validHeaders, { ...validQuery, state: 'A'.repeat(64) }],
    [validHeaders, { ...validQuery, state: [state] }],
    [validHeaders, { ...validQuery, code: '' }],
    [validHeaders, { ...validQuery, code: 'x'.repeat(2049) }],
    [validHeaders, { ...validQuery, iss: 'https://attacker.test' }],
  ];
  for (const [headers, query] of cases) {
    await assert.rejects(auth.complete(headers, query), /OAuth認可応答が不正/);
    assert.equal(consumed, 0, 'invalid callback must not consume a one-time state');
  }
});

test('OAuth state is consumed exactly once before an author session is issued', async () => {
  const { DiscordAuthService } = require('../dist/discord-auth.service.js');
  const originalFetch = globalThis.fetch;
  const state = 'c'.repeat(64);
  const authorId = '123456789012345678';
  let deletes = 0;
  let sessions = 0;
  let tokenRequests = 0;
  const auth = Object.create(DiscordAuthService.prototype);
  Object.assign(auth, {
    pool: { query: async (sql) => {
      if (sql.startsWith('DELETE FROM oauth_states')) {
        deletes++;
        return { rows: deletes === 1 ? [{ code_verifier: 'test-verifier' }] : [] };
      }
      if (sql.startsWith('INSERT INTO author_sessions')) {
        sessions++;
        return { rowCount: 1 };
      }
      throw new Error('Unexpected query: ' + sql);
    } },
    clientId: 'test-client', clientSecret: 'test-secret',
    authorId, origin: 'https://example.test',
  });
  globalThis.fetch = async (url) => {
    if (url === 'https://discord.com/api/oauth2/token') {
      tokenRequests++;
      return { ok: true, json: async () => ({ access_token: 'synthetic-token' }) };
    }
    if (url === 'https://discord.com/api/users/@me')
      return { ok: true, json: async () => ({ id: authorId }) };
    throw new Error('Unexpected OAuth endpoint');
  };
  try {
    const headers = { cookie: 'eternalia_oauth_state=' + state };
    const query = { state, code: 'one-time-code', iss: 'https://discord.com' };
    const result = await auth.complete(headers, query);
    assert.match(result.setCookie, /^eternalia_author=[0-9a-f]{64};/);
    assert.match(result.setCookie, /; HttpOnly; SameSite=Lax; Max-Age=604800; Secure$/);
    assert.equal(deletes, 1);
    assert.equal(sessions, 1);
    assert.equal(tokenRequests, 1);
    await assert.rejects(auth.complete(headers, query), /OAuth認可状態が失効/);
    assert.equal(deletes, 2);
    assert.equal(sessions, 1, 'replayed callback must not create another session');
    assert.equal(tokenRequests, 1, 'replayed callback must not exchange another token');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('OAuth callback for a non-author never issues a session', async () => {
  // Synthetic callback boundary: a valid one-time state and Discord token
  // cannot grant author privileges to a different Discord account.
  const { DiscordAuthService } = require('../dist/discord-auth.service.js');
  const originalFetch = globalThis.fetch;
  const state = 'd'.repeat(64);
  let deletes = 0;
  let sessions = 0;
  let exchanges = 0;
  let profiles = 0;
  const auth = Object.create(DiscordAuthService.prototype);
  Object.assign(auth, {
    pool: { query: async (sql) => {
      if (sql.startsWith('DELETE FROM oauth_states')) {
        deletes++;
        return { rows: deletes === 1 ? [{ code_verifier: 'test-verifier' }] : [] };
      }
      if (sql.startsWith('INSERT INTO author_sessions')) {
        sessions++;
        throw new Error('Non-author must not reach session insertion');
      }
      throw new Error('Unexpected query: ' + sql);
    } },
    clientId: 'test-client', clientSecret: 'test-secret',
    authorId: '123456789012345678', origin: 'https://example.test',
  });
  globalThis.fetch = async (url) => {
    if (url === 'https://discord.com/api/oauth2/token') {
      exchanges++;
      return { ok: true, json: async () => ({ access_token: 'synthetic-token' }) };
    }
    if (url === 'https://discord.com/api/users/@me') {
      profiles++;
      return { ok: true, json: async () => ({ id: '999999999999999999' }) };
    }
    throw new Error('Unexpected OAuth endpoint');
  };
  try {
    const headers = { cookie: 'eternalia_oauth_state=' + state };
    const query = { state, code: 'one-time-code', iss: 'https://discord.com' };
    await assert.rejects(auth.complete(headers, query), /作者として許可されていません/);
    assert.equal(deletes, 1);
    assert.equal(exchanges, 1);
    assert.equal(profiles, 1);
    assert.equal(sessions, 0);
    await assert.rejects(auth.complete(headers, query), /OAuth認可状態が失効/);
    assert.equal(deletes, 2);
    assert.equal(exchanges, 1);
    assert.equal(sessions, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
