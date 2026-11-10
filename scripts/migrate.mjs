/**
 * Explicit one-time/forward-only migrations, no implicit startup mutation.
 * Requires DATABASE_URL and an initialized local Postgres instance.
 */
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required for db:migrate');
  process.exitCode = 1;
} else {
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const directory = resolve(import.meta.dirname, '../db/migrations');
    const filenames = (await readdir(directory)).filter(f => /^\d{3}_[a-z0-9_]+\.sql$/.test(f)).sort();
    for (const filename of filenames) {
      await client.query('BEGIN');
      try {
        await client.query('SELECT pg_advisory_xact_lock(23141029)');
        const already = await client.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [filename]);
        if (already.rowCount === 0) {
          await client.query(await readFile(resolve(directory, filename), 'utf8'));
          await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
          console.log('Applied', filename);
        } else {
          console.log('Skipped', filename);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
