// HTTP acceptance against real built NestJS + Nuxt servers and PostgreSQL.
// Uses no mocked author session; real Discord account E2E is a separate check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL ?? 'http://127.0.0.1:3000';
const api = process.env.HTTP_API_URL ?? 'http://127.0.0.1:3001';

async function get(path, origin = base) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  return { status: response.status, body: await response.text(), headers: response.headers };
}
async function json(path, origin = base) {
  const response = await get(path, origin);
  return { ...response, value: response.status === 200 ? JSON.parse(response.body) : null };
}

test('anonymous published series and all four content domains load through Nuxt proxy', async () => {
  const listed = await json('/api/public/series');
  assert.equal(listed.status, 200);
  assert.ok(listed.value.some(node => node.id === fixture.seriesA));
  assert.ok(listed.value.some(node => node.id === fixture.seriesB));
  const tree = await json('/api/public/series/' + fixture.seriesA + '/tree');
  assert.equal(tree.status, 200);
  const ids = tree.value.map(node => node.id);
  for (const id of [
    fixture.volume, fixture.part, fixture.chapter, fixture.category, fixture.tip,
    fixture.section, fixture.language, fixture.word, fixture.grammar, fixture.period, fixture.event,
  ]) assert.ok(ids.includes(id), 'missing published id ' + id);
  assert.ok(!ids.includes(fixture.languageB), 'other series must not appear');
  for (const path of [
    '/stories/' + fixture.seriesA,
    '/tips/' + fixture.seriesA,
    '/dictionaries/' + fixture.seriesA,
    '/timeline/' + fixture.seriesA,
  ]) {
    const page = await get(path);
    assert.equal(page.status, 200, path);
    assert.ok(page.body.includes(fixture.prefix + '-world-A'), path);
  }
});

test('private ancestors, unpublished children and future publications never leak via API or SSR', async () => {
  const tree = await json('/api/public/series/' + fixture.seriesA + '/tree');
  for (const id of [fixture.hiddenCategory, fixture.hiddenTip, fixture.unpublishedTip, fixture.scheduled]) {
    assert.ok(!tree.value.some(node => node.id === id), 'leaked tree id ' + id);
    assert.equal((await get('/api/public/items/' + id)).status, 404);
    assert.equal((await get('/api/public/items/' + id, api)).status, 404);
  }
  const recent = await json('/api/public/recent');
  for (const id of [fixture.hiddenTip, fixture.unpublishedTip, fixture.scheduled]) {
    assert.ok(!recent.value.some(node => node.id === id), 'leaked recent id ' + id);
  }
  const pages = await Promise.all([
    get('/stories/' + fixture.seriesA),
    get('/tips/' + fixture.seriesA),
    get('/'),
  ]);
  for (const page of pages) {
    assert.equal(page.status, 200);
    for (const forbidden of [
      fixture.prefix + '-private-tip', fixture.prefix + '-private-content',
      fixture.prefix + '-unpublished-tip', fixture.prefix + '-scheduled-secret',
      fixture.prefix + '-unpublished-draft-body',
    ]) assert.ok(!page.body.includes(forbidden), 'SSR leaked ' + forbidden);
  }
});

test('published chapter body survives an unpublished draft edit across direct read and Nuxt SSR', async () => {
  const publicResponse = await json('/api/public/items/' + fixture.chapter);
  assert.equal(publicResponse.status, 200);
  assert.ok(publicResponse.value.content.body.includes(fixture.prefix + '-published-body'));
  assert.ok(!publicResponse.body.includes(fixture.prefix + '-unpublished-draft'));
  const reader = await get('/read/' + fixture.chapter + '?series=' + fixture.seriesA);
  assert.equal(reader.status, 200);
  assert.ok(reader.body.includes(fixture.prefix + '-published-body'));
  assert.ok(!reader.body.includes(fixture.prefix + '-unpublished-draft'));
});

test('anonymous requests cannot read or mutate author library or memos', async () => {
  for (const path of ['/api/admin/nodes', '/api/admin/memos']) {
    const response = await get(path);
    assert.equal(response.status, 401, path + ' must require author');
  }
  const response = await fetch(base + '/api/admin/nodes', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Origin:base },
    body: JSON.stringify({ kind:'series', content:{title:'intrusion',body:'',details:{}} }),
  });
  assert.equal(response.status, 401);
  const forbidden = await fetch(base + '/api/admin/memos', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Origin:base },
    body: JSON.stringify({title:'intrusion',body:'',tags:[]}),
  });
  assert.equal(forbidden.status, 401);
});

test('real API returns no-store responses and unauthenticated session', async () => {
  const response = await get('/api/public/series', api);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const me = await json('/api/auth/me');
  assert.equal(me.value.authenticated, false);
});
