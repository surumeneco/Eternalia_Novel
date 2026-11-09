// TASK-20261101-008: Draft AC-SESSION-COOKIE-01..03.
// Synthetic author-session authorization only; real Discord/browser/DB not-run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { DiscordAuthService } = require('../dist/discord-auth.service.js');

const first = 'a'.repeat(64);
const second = 'b'.repeat(64);

function fixture() {
  const queries = [];
  const auth = Object.create(DiscordAuthService.prototype);
  Object.assign(auth, {
    pool: { query: async (sql, params) => {
      queries.push({ sql, params });
      return { rowCount: 1, rows: [{ '?column?': 1 }] };
    } },
    clientId: 'fixture', clientSecret: 'fixture',
    authorId: '123456789012345678', origin: 'https://example.test',
  });
  return { auth, queries };
}

for (const scenario of [
  { name: 'different duplicate author-session cookies', cookie: first + '; eternalia_author=' + second },
  { name: 'identical duplicate author-session cookies', cookie: first + '; eternalia_author=' + first },
]) {
  test(scenario.name + ' are rejected before session DB lookup', async () => {
    const { auth, queries } = fixture();
    const authorized = await auth.isAuthor({
      cookie: 'eternalia_author=' + scenario.cookie,
    });
    assert.equal(authorized, false);
    assert.equal(queries.length, 0, 'ambiguous cookies must not query author sessions');
  });
}

test('one valid author-session cookie still uses the registered-session lookup', async () => {
  const { auth, queries } = fixture();
  assert.equal(await auth.isAuthor({ cookie: 'eternalia_author=' + first }), true);
  assert.equal(queries.length, 1);
  assert.match(queries[0].sql, /SELECT 1 FROM author_sessions/);
  assert.equal(queries[0].params[1], '123456789012345678');
});
