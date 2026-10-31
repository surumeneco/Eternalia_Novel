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


/**
 * A synthetic database session exercises the full Nest guard and persistence
 * boundary. This intentionally does NOT test Discord's real OAuth2 exchange.
 */
test('synthetic author completes four-domain HTTP publication and privacy cycle', async () => {
  const session = fixture.authorToken;
  async function request(method, path, body, token = session, origin = base) {
    const response = await fetch(base + path, {
      method,
      headers: {
        Cookie: 'eternalia_author=' + token,
        Origin: origin,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.text() };
  }
  async function create(kind, parentId, title, body = '', details = {}) {
    const result = await request('POST', '/api/admin/nodes', {
      kind, parentId, content: { title, body, details },
    });
    assert.equal(result.status, 201, 'create ' + kind + ': ' + result.body);
    return JSON.parse(result.body).id;
  }
  async function post(path, body, expected = 200) {
    const result = await request('POST', path, body);
    assert.equal(result.status, expected, path + ': ' + result.body);
    return result;
  }

  const untrusted = await request('GET', '/api/admin/nodes', undefined, fixture.outsiderToken);
  assert.equal(untrusted.status, 401, 'a valid session for another Discord user cannot edit');

  const world = await create('series', null, '往復検証の世界');
  const volume = await create('volume', world, '編');
  const part = await create('part', volume, '部');
  const chapter = await create('chapter', part, '章', '公開本文');
  const category = await create('category', world, '分類', '', { presets: '[]' });
  const tip = await create('tip', category, '設定');
  const tipSection = await create('tipSection', tip, '項目', '公開設定項目');
  const language = await create('language', world, '言語', '', { characters:'[]',wordClasses:'[]' });
  const word = await create('word', language, '単語', '', {meanings:'[]'});
  const grammar = await create('grammar', language, '文法');
  const period = await create('periodization', world, '年代区分');
  const event = await create('event', period, '出来事', '公開された出来事', {year:'1'});
  const ids = [world, volume, part, chapter, category, tip, tipSection,
    language, word, grammar, period, event];

  assert.equal((await get('/api/public/items/' + chapter)).status, 404,
    'created drafts are not anonymously readable');
  const unauthorizedOrigin = await request('POST', '/api/admin/nodes', {
    kind:'series', content:{title:'拒否される作成',body:'',details:{}},
  }, session, 'https://other-origin.invalid');
  assert.equal(unauthorizedOrigin.status, 403, 'authenticated writes need an allowed Origin');

  for (const id of ids) {
    await post('/api/admin/nodes/' + id + '/publish', {expectedRevision:1});
  }
  const tree = await json('/api/public/series/' + world + '/tree');
  assert.equal(tree.status, 200);
  for (const id of ids) assert.ok(tree.value.some(n => n.id === id),
    'publication did not expose ' + id);
  const before = await json('/api/public/items/' + chapter);
  assert.equal(before.value.content.body, '公開本文');
  const saved = await request('PATCH', '/api/admin/nodes/' + chapter, {
    expectedRevision:1, content:{title:'章',body:'まだ非公開の第二稿',details:{}},
  });
  assert.equal(saved.status, 200, saved.body);
  assert.equal((await json('/api/public/items/' + chapter)).value.content.body,
    '公開本文', 'draft save must not update public snapshot');
  const stale = await request('PATCH', '/api/admin/nodes/' + chapter, {
    expectedRevision:1, content:{title:'章',body:'失われる旧稿',details:{}},
  });
  assert.equal(stale.status, 409, 'stale revision must not overwrite draft');
  await post('/api/admin/nodes/' + chapter + '/publish', {expectedRevision:2});
  assert.equal((await json('/api/public/items/' + chapter)).value.content.body,
    'まだ非公開の第二稿', 'explicit publishing updates the public version');

  await post('/api/admin/nodes/' + world + '/visibility', {
    expectedRevision:1, isPublic:false, publicSince:null,
  });
  for (const id of [world,chapter,tipSection,word,grammar,event]) {
    assert.equal((await get('/api/public/items/' + id)).status, 404,
      'private series must hide descendants: ' + id);
  }
  await post('/api/admin/nodes/' + world + '/visibility', {
    expectedRevision:2, isPublic:true, publicSince:null,
  });
  assert.equal((await get('/api/public/items/' + chapter)).status, 200,
    'reopening the series must restore previously public descendants');

  const logout = await request('POST', '/api/auth/logout', {});
  assert.equal(logout.status, 201, logout.body);
  assert.equal((await request('GET', '/api/admin/nodes')).status, 401,
    'revoked author session must no longer work');
});
