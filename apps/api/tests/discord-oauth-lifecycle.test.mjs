/**
 * Synthetic Discord provider, REAL PostgreSQL state/session lifecycle.
 * Exploratory author-allowlist and PKCE test; not a real Discord OAuth E2E.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import pg from 'pg';
import 'reflect-metadata';
const require = createRequire(import.meta.url);
const { DiscordAuthService } = require('../dist/discord-auth.service.js');

const sha256 = value => createHash('sha256').update(value).digest('hex');
const challenge = value => createHash('sha256').update(value).digest('base64url');
const allowlistedId = '123456789012345678';
const outsiderId = '987654321098765432';

function assertStatus(status) {
  return error => error?.getStatus?.() === status;
}

test('PKCE/state one-time redemption, author allowlist, expiry and session revocation use PostgreSQL',
  { timeout: 60_000 }, async () => {
    assert.ok(process.env.DATABASE_URL, 'a disposable migrated integration PostgreSQL is required');
    // The real HTTP acceptance environment uses these same configuration shapes.
    // The provider secret here is deliberately not a genuine Discord credential.
    const env = new Map([
      ['DISCORD_CLIENT_ID', process.env.DISCORD_CLIENT_ID],
      ['DISCORD_CLIENT_SECRET', process.env.DISCORD_CLIENT_SECRET],
      ['DISCORD_AUTHOR_USER_ID', process.env.DISCORD_AUTHOR_USER_ID],
      ['APP_ORIGIN', process.env.APP_ORIGIN],
    ]);
    process.env.DISCORD_CLIENT_ID = allowlistedId;
    process.env.DISCORD_CLIENT_SECRET = 'test-only-mock-provider';
    process.env.DISCORD_AUTHOR_USER_ID = allowlistedId;
    process.env.APP_ORIGIN = 'http://127.0.0.1:34110';
    const actualFetch = globalThis.fetch;
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const auth = new DiscordAuthService();
    let tokenExchanges = 0;
    let identityLookups = 0;
    try {
      globalThis.fetch = async (input, options = {}) => {
        const url = String(input);
        if (url === 'https://discord.com/api/oauth2/token') {
          tokenExchanges++;
          assert.equal(options.method, 'POST');
          assert.equal(options.body.get('grant_type'), 'authorization_code');
          assert.equal(options.body.get('redirect_uri'),
            'http://127.0.0.1:34110/api/auth/discord/callback');
          assert.match(options.body.get('code_verifier') ?? '', /^[A-Za-z0-9_-]{43}$/);
          const expectedBasic = Buffer.from(allowlistedId + ':test-only-mock-provider').toString('base64');
          assert.equal(options.headers.Authorization, 'Basic ' + expectedBasic);
          const code = options.body.get('code');
          assert.ok(['author-code', 'outsider-code'].includes(code));
          return Response.json({ access_token: code === 'author-code' ? 'author-token' : 'outsider-token' });
        }
        if (url === 'https://discord.com/api/users/@me') {
          identityLookups++;
          const bearer = options.headers.Authorization;
          assert.ok(['Bearer author-token', 'Bearer outsider-token'].includes(bearer));
          return Response.json({ id: bearer === 'Bearer author-token' ? allowlistedId : outsiderId });
        }
        throw new Error('Unexpected network target in synthetic OAuth test');
      };
      async function begin() {
        const value = await auth.start();
        const redirect = new URL(value.redirect);
        const state = redirect.searchParams.get('state');
        assert.match(state ?? '', /^[a-f0-9]{64}$/);
        assert.ok(value.setCookie.startsWith('eternalia_oauth_state=' + state + ';'));
        assert.equal(redirect.searchParams.get('code_challenge_method'), 'S256');
        const stored = await pool.query(
          'SELECT code_verifier FROM oauth_states WHERE state_digest=$1', [sha256(state)],
        );
        assert.equal(stored.rows.length, 1, 'state must be persisted as a digest');
        assert.equal(redirect.searchParams.get('code_challenge'),
          challenge(stored.rows[0].code_verifier), 'S256 challenge must match persisted verifier');
        return { state, cookie: 'eternalia_oauth_state=' + state };
      }
      const first = await begin();
      const result = await auth.complete({ cookie: first.cookie },
        { state: first.state, code: 'author-code', iss: 'https://discord.com' });
      assert.match(result.setCookie, /HttpOnly/);
      assert.match(result.setCookie, /SameSite=Lax/);
      const match = result.setCookie.match(/^eternalia_author=([a-f0-9]{64});/);
      assert.ok(match, 'the application should issue a new opaque author cookie');
      const session = 'eternalia_author=' + match[1];
      assert.equal(await auth.isAuthor({ cookie: session }), true);
      const storedSession = await pool.query(
        'SELECT discord_user_id FROM author_sessions WHERE session_digest=$1',
        [sha256(match[1])],
      );
      assert.equal(storedSession.rows[0]?.discord_user_id, allowlistedId);
      const beforeReplay = tokenExchanges;
      await assert.rejects(auth.complete({ cookie: first.cookie },
        { state: first.state, code: 'author-code' }), assertStatus(401));
      assert.equal(tokenExchanges, beforeReplay, 'replayed state must be blocked before provider call');

      const outsider = await begin();
      await assert.rejects(auth.complete({ cookie: outsider.cookie },
        { state: outsider.state, code: 'outsider-code' }), assertStatus(403));
      assert.equal(await auth.isAuthor({ cookie: session }), true,
        'non-author rejection must not revoke the genuine author session');

      const expired = await begin();
      await pool.query("UPDATE oauth_states SET expires_at = NOW() - INTERVAL '1 second' " +
        'WHERE state_digest=$1', [sha256(expired.state)]);
      const beforeExpired = tokenExchanges;
      await assert.rejects(auth.complete({ cookie: expired.cookie },
        { state: expired.state, code: 'author-code' }), assertStatus(401));
      assert.equal(tokenExchanges, beforeExpired, 'expired state must not contact provider');

      await auth.logout({ cookie: session });
      assert.equal(await auth.isAuthor({ cookie: session }), false,
        'logout must revoke the opaque author session in PostgreSQL');
      assert.equal((await pool.query('SELECT 1 FROM author_sessions WHERE session_digest=$1',
        [sha256(match[1])])).rows.length, 0);
      assert.equal(tokenExchanges, 2, 'only the legitimate and non-author callbacks may exchange');
      assert.equal(identityLookups, 2);
    } finally {
      globalThis.fetch = actualFetch;
      await auth.onModuleDestroy();
      await pool.end();
      for (const [key, value] of env) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
