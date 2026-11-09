// TASK-20261101-008: Draft AC-OAUTH-COOKIE-01..03.
// Synthetic OAuth callback boundary only; real Discord/browser acceptance not-run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { DiscordAuthService } = require('../dist/discord-auth.service.js');

function fixture() {
  let queries = 0;
  let tokenCalls = 0;
  let sessions = 0;
  const auth = Object.create(DiscordAuthService.prototype);
  Object.assign(auth, {
    pool: { query: async sql => {
      queries++;
      if (sql.startsWith('DELETE FROM oauth_states')) {
        return { rows: [{ code_verifier: 'synthetic-verifier' }] };
      }
      if (sql.startsWith('INSERT INTO author_sessions')) {
        sessions++;
        throw new Error('Unexpected author session');
      }
      throw new Error('Unexpected query: ' + sql);
    } },
    clientId: 'fixture', clientSecret: 'fixture',
    authorId: '123456789012345678', origin: 'https://example.test',
  });
  return {
    auth,
    recordTokenCall: () => { tokenCalls++; },
    counts: () => ({ queries, tokenCalls, sessions }),
  };
}

for (const duplicate of [
  { name: 'different duplicate state cookies', second: 'a'.repeat(64) },
  { name: 'identical duplicate state cookies', second: 'b'.repeat(64) },
]) {
  test(duplicate.name + ' are rejected before consuming OAuth state', async () => {
    const state = 'b'.repeat(64);
    const { auth, recordTokenCall, counts } = fixture();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      recordTokenCall();
      return { ok: false, status: 502 };
    };
    try {
      const headers = {
        cookie: 'eternalia_oauth_state=' + state +
          '; eternalia_oauth_state=' + duplicate.second,
      };
      await assert.rejects(
        auth.complete(headers, { state, code: 'fixture-code', iss: 'https://discord.com' }),
        /OAuth認可応答が不正/,
      );
      assert.deepEqual(counts(), { queries: 0, tokenCalls: 0, sessions: 0 });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test('one valid state cookie still consumes state before token failure', async () => {
  const state = 'c'.repeat(64);
  const { auth, recordTokenCall, counts } = fixture();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    recordTokenCall();
    return { ok: false, status: 502 };
  };
  try {
    await assert.rejects(
      auth.complete(
        { cookie: 'eternalia_oauth_state=' + state },
        { state, code: 'fixture-code', iss: 'https://discord.com' },
      ),
      /Discord認証応答を取得できません/,
    );
    assert.deepEqual(counts(), { queries: 1, tokenCalls: 1, sessions: 0 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
