/**
 * CI-only deterministic-shape fixture with random identifiers.
 * Writes through the same domain and PostgreSQL repository as the app,
 * and never writes secrets or demo data into checked-in sources.
 */
import 'reflect-metadata';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createNode, editNode, newLibrary, publishNode, setVisibility } from '@eternalia/contracts';
const require = createRequire(import.meta.url);
const { PostgresLibraryService } = require('../apps/api/dist/postgres-library.service.js');

if (!process.env.DATABASE_URL || !process.env.HTTP_FIXTURE_FILE) {
  throw new Error('DATABASE_URL and HTTP_FIXTURE_FILE are required');
}
const prefix = 'acceptance-' + randomUUID();
const now = Date.now() - 10_000;
let library = newLibrary();
function add(kind, parentId, suffix, body = '', details = {}) {
  const id = randomUUID();
  library = createNode(library, {
    id, kind, parentId, now, content: { title: prefix + '-' + suffix, body, details },
  });
  return id;
}
function publish(id) {
  const revision = library.nodes.find(node => node.id === id).revision;
  library = publishNode(library, id, revision, now);
}
const seriesA = add('series', null, 'world-A');
const seriesB = add('series', null, 'world-B');
const volume = add('volume', seriesA, 'book-A');
const part = add('part', volume, 'part-A');
const chapter = add('chapter', part, 'chapter-A', prefix + '-published-body\n\n[[page]]');
const scheduled = add('chapter', part, 'scheduled-secret');
const category = add('category', seriesA, 'visible-category', '', { presets: '[]' });
const tip = add('tip', category, 'visible-setting');
const section = add('tipSection', tip, 'visible-section', prefix + '-visible-detail');
const hiddenCategory = add('category', seriesA, 'private-category', '', { presets: '[]' });
const hiddenTip = add('tip', hiddenCategory, 'private-tip', prefix + '-private-content');
const unpublishedTip = add('tip', category, 'unpublished-tip', prefix + '-unpublished');
const language = add('language', seriesA, 'visible-language');
const word = add('word', language, 'visible-word', prefix + '-visible-word-body');
const grammar = add('grammar', language, 'visible-grammar');
const period = add('periodization', seriesA, 'visible-period');
const event = add('event', period, 'visible-event', prefix + '-visible-event-body', { year: '12' });
const languageB = add('language', seriesB, 'only-in-B');
for (const id of [
  seriesA, seriesB, volume, part, chapter, scheduled, category, tip, section,
  hiddenCategory, hiddenTip, language, word, grammar, period, event, languageB,
]) publish(id);
let revision = library.nodes.find(node => node.id === hiddenCategory).revision;
library = setVisibility(library, hiddenCategory, revision, false, null, now);
revision = library.nodes.find(node => node.id === scheduled).revision;
library = setVisibility(library, scheduled, revision, true, now + 86_400_000, now);
revision = library.nodes.find(node => node.id === chapter).revision;
library = editNode(library, chapter, revision, {
  title: prefix + '-unpublished-draft-title',
  body: prefix + '-unpublished-draft-body',
  details: {},
}, now);
const repository = new PostgresLibraryService();
try {
  await repository.mutate(previous => ({ nodes: [...previous.nodes, ...library.nodes] }));
} finally {
  await repository.onModuleDestroy();
}
// Synthetic opaque sessions test the author boundary without contacting Discord.
const testAuthorId = process.env.HTTP_ACCEPTANCE_TEST_AUTHOR_ID ?? '';
if (!/^\d{15,25}$/.test(testAuthorId)) {
  throw new Error('HTTP_ACCEPTANCE_TEST_AUTHOR_ID must be an isolated synthetic account ID');
}
const authorToken = randomBytes(32).toString('hex');
const outsiderToken = randomBytes(32).toString('hex');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  for (const [token, userId] of [
    [authorToken, testAuthorId],
    [outsiderToken, '987654321098765432'],
  ]) {
    await pool.query(
      "INSERT INTO author_sessions(session_digest,discord_user_id,expires_at) VALUES ($1,$2,NOW() + INTERVAL '1 hour')",
      [createHash('sha256').update(token).digest('hex'), userId],
    );
  }
} finally {
  await pool.end();
}
const fixture = {
  authorToken, outsiderToken,
  prefix, seriesA, seriesB, volume, part, chapter, scheduled, category,
  tip, section, hiddenCategory, hiddenTip, unpublishedTip, language, word,
  grammar, period, event, languageB,
};
await writeFile(process.env.HTTP_FIXTURE_FILE, JSON.stringify(fixture), { mode: 0o600 });
console.log('Seeded HTTP acceptance fixture', prefix);
