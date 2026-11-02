// Synthetic OAuth failure-boundary regression, not a real Discord login.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { DiscordAuthService } = require('../dist/discord-auth.service.js');

test('failed token exchange consumes the one-time state and cannot issue a session', async () => {
  const originalFetch = globalThis.fetch;
  const state = 'e'.repeat(64);
  let stateDeletes = 0;
  let exchanges = 0;
  let sessions = 0;
  const auth = Object.create(DiscordAuthService.prototype);
  Object.assign(auth, {
    pool: { query: async (sql) => {
      if (sql.startsWith('DELETE FROM oauth_states')) {
        stateDeletes++;
        return { rows: stateDeletes === 1 ? [{ code_verifier: 'fixture' }] : [] };
      }
      if (sql.startsWith('INSERT INTO author_sessions')) {
        sessions++;
        throw new Error('unexpected session insertion');
      }
      throw new Error('unexpected query');
    } },
    clientId: 'fixture', clientSecret: 'fixture',
    authorId: '123456789012345678', origin: 'https://example.test',
  });
  globalThis.fetch = async url => {
    assert.equal(url, 'https://discord.com/api/oauth2/token');
    exchanges++;
    return { ok: false, status: 502 };
  };
  try {
    const headers = { cookie: 'eternalia_oauth_state=' + state };
    const query = { state, code: 'fixture-code', iss: 'https://discord.com' };
    await assert.rejects(auth.complete(headers, query), /Discord認証応答を取得できません/);
    assert.equal(stateDeletes, 1);
    assert.equal(exchanges, 1);
    assert.equal(sessions, 0);
    await assert.rejects(auth.complete(headers, query), /OAuth認可状態が失効/);
    assert.equal(stateDeletes, 2);
    assert.equal(exchanges, 1);
    assert.equal(sessions, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
