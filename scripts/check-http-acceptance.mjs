/**
 * Manual real HTTP acceptance: built NestJS + Nuxt + PostgreSQL.
 * Prerequisites: npm run build, npm run db:migrate, DATABASE_URL.
 * Run: node --env-file-if-exists=.env scripts/check-http-acceptance.mjs
 * This is HTTP/SSR integration, not an actual browser or Discord OAuth E2E.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must point to a migrated PostgreSQL database');
}

const tmp = await mkdtemp(join(tmpdir(), 'eternalia-http-'));
const port = Number(process.env.HTTP_WEB_PORT || 34110);
const apiPort = Number(process.env.HTTP_API_PORT || 34111);
const fixture = join(tmp, 'fixture.json');
const env = {
  ...process.env,
  HTTP_FIXTURE_FILE: fixture,
  HTTP_BASE_URL: 'http://127.0.0.1:' + port,
  HTTP_API_URL: 'http://127.0.0.1:' + apiPort,
  API_PORT: String(apiPort),
  NITRO_PORT: String(port),
  NUXT_API_INTERNAL_URL: 'http://127.0.0.1:' + apiPort,
  // CI/local acceptance uses only synthetic sessions in an isolated database.
  // Never pass real Discord OAuth credentials to the spawned test processes.
  APP_ORIGIN: 'http://127.0.0.1:' + port,
  DISCORD_CLIENT_ID: '123456789012345678',
  DISCORD_CLIENT_SECRET: 'test-placeholder-not-a-discord-secret',
  DISCORD_AUTHOR_USER_ID: '123456789012345678',
  HTTP_ACCEPTANCE_TEST_AUTHOR_ID: '123456789012345678',
};
const processes = [];

async function command(args) {
  const child = spawn(process.execPath, args, { cwd: process.cwd(), env, stdio: 'inherit' });
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  if (code !== 0) throw new Error(args.join(' ') + ' exited with code ' + code);
}
function server(args) {
  const child = spawn(process.execPath, args, { cwd: process.cwd(), env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', data => process.stdout.write(data));
  child.stderr.on('data', data => process.stderr.write(data));
  processes.push(child);
  return child;
}
async function ready(url) {
  for (let i = 0; i < 60; i++) {
    try {
      const result = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (result.ok) return;
    } catch { /* wait for startup */ }
    await delay(500);
  }
  throw new Error('Timed out waiting for server: ' + url);
}

try {
  // Seed only into the explicitly configured database. The resulting records
  // remain for inspection; use a disposable test database, never production.
  console.log('NOTICE: this command inserts test records into DATABASE_URL.');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('HTTP acceptance cannot seed a production environment');
  }
  await command(['scripts/seed-http-acceptance.mjs']);
  server(['apps/api/dist/main.js']);
  server(['apps/web/.output/server/index.mjs']);
  await ready('http://127.0.0.1:' + apiPort + '/api/health');
  await ready('http://127.0.0.1:' + port + '/');
  await command(['--test', 'apps/api/http-acceptance/http-acceptance.test.mjs']);
} finally {
  for (const child of processes) child.kill();
  await rm(tmp, { recursive: true, force: true });
}
