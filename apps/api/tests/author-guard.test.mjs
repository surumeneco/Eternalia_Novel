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
