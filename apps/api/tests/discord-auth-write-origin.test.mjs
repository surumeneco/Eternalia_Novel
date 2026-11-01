// TASK-20261101-008: the actual DiscordAuthService write-origin guard,
// independent of Nest body-parser behavior and real Discord OAuth exchange.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { DiscordAuthService } = require('../dist/discord-auth.service.js');

function configuredGuard() {
  // No network or database access: exercise the production guard method with
  // the same configured fields, not a mock of assertWriteOrigin itself.
  const guard = Object.create(DiscordAuthService.prototype);
  Object.assign(guard, {
    pool: {}, clientId: 'test-client', clientSecret: 'test-secret',
    authorId: '123456789012345678', origin: 'https://example.test',
  });
  assert.equal(guard.configured, true);
  return guard;
}

test('author write origin requires exact JSON media type', () => {
  const guard = configuredGuard();
  const headers = contentType => ({
    origin: 'https://example.test', 'content-type': contentType,
  });
  for (const invalid of [
    'application/jsonp', 'application/json-seq',
    'application/json-malformed', 'text/plain', '', undefined,
  ]) {
    assert.throws(() => guard.assertWriteOrigin(headers(invalid)), undefined,
      'unexpectedly accepted ' + invalid);
  }
  for (const valid of ['application/json', 'Application/JSON; charset=utf-8']) {
    assert.doesNotThrow(() => guard.assertWriteOrigin(headers(valid)), valid);
  }
  assert.throws(() => guard.assertWriteOrigin({
    origin: 'https://attacker.test', 'content-type': 'application/json',
  }));
});
