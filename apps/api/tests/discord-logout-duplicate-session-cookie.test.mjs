// TASK-20261101-008 / AUTH-LOGOUT-01..03 (CAT Draft).
// Synthetic DB-spy boundary; no real browser cookie Path or PostgreSQL.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { DiscordAuthService } = require('../dist/discord-auth.service.js');

const a = 'a'.repeat(64);
const b = 'b'.repeat(64);
const digest = value => createHash('sha256').update(value).digest('hex');

function fixture() {
  const deleted = [];
  const auth = Object.create(DiscordAuthService.prototype);
  Object.assign(auth, {
    pool: { query: async (sql, params) => {
      assert.match(sql, /^DELETE FROM author_sessions WHERE session_digest=\$1$/);
      deleted.push(params[0]);
      return { rowCount: 1 };
    } },
  });
  return { auth, deleted };
}

test('logout revokes both distinct presented session tokens', async () => {
  const { auth, deleted } = fixture();
  await auth.logout({ cookie: 'eternalia_author=' + a + '; eternalia_author=' + b });
  assert.deepEqual(new Set(deleted), new Set([digest(a), digest(b)]));
  assert.equal(deleted.length, 2);
});

test('logout deduplicates identical session tokens', async () => {
  const { auth, deleted } = fixture();
  await auth.logout({ cookie: 'eternalia_author=' + a + '; eternalia_author=' + a });
  assert.deepEqual(deleted, [digest(a)]);
});

test('logout still revokes one ordinary session', async () => {
  const { auth, deleted } = fixture();
  await auth.logout({ cookie: 'eternalia_author=' + a });
  assert.deepEqual(deleted, [digest(a)]);
});
