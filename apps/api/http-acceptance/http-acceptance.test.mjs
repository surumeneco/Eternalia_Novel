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
  const detailPages = [
    ['/stories/' + fixture.seriesA, '目次'],
    ['/tips/' + fixture.seriesA, '設定を検索'],
    ['/dictionaries/' + fixture.seriesA, '単語を検索'],
    ['/timeline/' + fixture.seriesA, '年代区分'],
  ];
  for (const [path, domainMarker] of detailPages) {
    const page = await get(path);
    assert.equal(page.status, 200, path);
    assert.ok(page.body.includes(fixture.prefix + '-world-A'), path);
    assert.ok(page.body.includes(domainMarker),
      path + ' must render its domain-specific nested route, not the parent collection');
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

// Exploratory HTTP/privacy evidence only; not a confirmed CAT-generated test.
test('anonymous breadcrumb paths exclude hidden ancestors, drafts and scheduled items', async () => {
  const pathOf = id => '/api/public/items/' + id + '/path';
  const expected = [fixture.seriesA, fixture.volume, fixture.part, fixture.chapter];
  const secretMarkers = [
    fixture.prefix + '-private-content',
    fixture.prefix + '-private-tip',
    fixture.prefix + '-unpublished-tip',
    fixture.prefix + '-scheduled-secret',
    fixture.prefix + '-unpublished-draft-body',
  ];
  // Check both real Nest API and its Nuxt proxy, not merely a unit contract.
  for (const root of [base, api]) {
    const published = await json(pathOf(fixture.chapter), root);
    assert.equal(published.status, 200, 'published chapter path ' + root);
    assert.deepEqual(published.value.map(node => node.id), expected,
      'published breadcrumbs must contain only the exact ancestor chain');
    for (const marker of secretMarkers) {
      assert.ok(!published.body.includes(marker), 'private draft leaked into public path: ' + marker);
    }
    for (const id of [fixture.hiddenCategory, fixture.hiddenTip,
                      fixture.unpublishedTip, fixture.scheduled]) {
      const blocked = await get(pathOf(id), root);
      assert.equal(blocked.status, 404,
        'blocked breadcrumb unexpectedly accessible for ' + id + ' via ' + root);
      for (const marker of secretMarkers) {
        assert.ok(!blocked.body.includes(marker), 'blocked response disclosed ' + marker);
      }
    }
  }
});

test('anonymous requests cannot read or mutate author library or memos', async () => {
  // AC-23: exercise both Nuxt proxy and direct Nest HTTP boundaries.
  const before = await get('/api/public/items/' + fixture.chapter);
  assert.equal(before.status, 200);
  const attempts = [
    ['GET', '/api/admin/nodes'],
    ['GET', '/api/admin/memos'],
    ['POST', '/api/admin/nodes', {
      kind: 'series', content: { title: 'intrusion', body: '', details: {} },
    }],
    ['POST', '/api/admin/memos', { title: 'intrusion', body: '', tags: [] }],
    ['PATCH', '/api/admin/nodes/' + fixture.chapter, {
      expectedRevision: 2,
      content: { title: 'intrusion', body: 'intrusion', details: {} },
    }],
    ['POST', '/api/admin/nodes/' + fixture.chapter + '/publish', {
      expectedRevision: 2,
    }],
    ['POST', '/api/admin/nodes/' + fixture.chapter + '/visibility', {
      expectedRevision: 2, isPublic: false, publicSince: null,
    }],
    ['POST', '/api/admin/order', {
      parentId: fixture.seriesA, kind: 'volume', orderedIds: [fixture.volume],
      expectedRevisions: { [fixture.volume]: 1 },
    }],
  ];
  for (const root of [base, api]) {
    for (const [method, path, body] of attempts) {
      const response = await fetch(root + path, {
        method,
        headers: { 'Content-Type': 'application/json', Origin: base },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      assert.equal(response.status, 401,
        'anonymous request must not access ' + method + ' ' + root + path);
    }
  }
  const after = await get('/api/public/items/' + fixture.chapter);
  assert.equal(after.status, 200);
  assert.equal(after.body, before.body,
    'anonymous mutation attempts must not change the public snapshot');
});

test('authenticated non-author session cannot mutate author resources', async () => {
  // AC-19/22: this uses a valid synthetic session for a different Discord
  // identity, not a malformed/expired cookie or real Discord OAuth exchange.
  async function request(token, method, path, body, root = base) {
    const response = await fetch(root + path, {
      method,
      headers: {
        Cookie: 'eternalia_author=' + token,
        Origin: base,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.text() };
  }

  const authorToken = fixture.authorToken;
  const outsiderToken = fixture.outsiderToken;
  assert.ok(authorToken && outsiderToken && authorToken !== outsiderToken);
  const beforeNodes = await request(authorToken, 'GET', '/api/admin/nodes');
  const beforeMemos = await request(authorToken, 'GET', '/api/admin/memos');
  const beforePublic = await get('/api/public/items/' + fixture.chapter);
  assert.equal(beforeNodes.status, 200);
  assert.equal(beforeMemos.status, 200);
  assert.equal(beforePublic.status, 200);
  const chapter = JSON.parse(beforeNodes.body).find(node => node.id === fixture.chapter);
  assert.ok(chapter, 'seeded chapter must be present for the author');

  const denied = [
    ['GET', '/api/admin/nodes'],
    ['GET', '/api/admin/memos'],
    ['POST', '/api/admin/nodes', {
      kind: 'series', content: { title: 'non-author-create', body: '', details: {} },
    }],
    ['POST', '/api/admin/memos', {
      title: 'non-author-memo', body: '', tags: [],
    }],
    ['PATCH', '/api/admin/nodes/' + fixture.chapter, {
      expectedRevision: chapter.revision,
      content: { ...chapter.draft, body: 'non-author-overwrite' },
    }],
    ['POST', '/api/admin/nodes/' + fixture.chapter + '/publish', {
      expectedRevision: chapter.revision,
    }],
    ['POST', '/api/admin/nodes/' + fixture.chapter + '/visibility', {
      expectedRevision: chapter.revision, isPublic: false, publicSince: null,
    }],
    ['POST', '/api/admin/order', {
      parentId: fixture.seriesA, kind: 'volume', orderedIds: [fixture.volume],
      expectedRevisions: { [fixture.volume]: 1 },
    }],
  ];
  for (const [method, path, body] of denied) {
    for (const root of [base, api]) {
      const response = await request(outsiderToken, method, path, body, root);
      assert.equal(response.status, 401,
        'a valid non-author session must not access ' + method + ' ' + root + path);
    }
  }

  const afterNodes = await request(authorToken, 'GET', '/api/admin/nodes');
  const afterMemos = await request(authorToken, 'GET', '/api/admin/memos');
  const afterPublic = await get('/api/public/items/' + fixture.chapter);
  assert.equal(afterNodes.status, 200);
  assert.equal(afterMemos.status, 200);
  assert.equal(afterPublic.status, 200);
  assert.deepEqual(JSON.parse(afterNodes.body), JSON.parse(beforeNodes.body),
    'denied writes must not alter author library data or revisions');
  assert.deepEqual(JSON.parse(afterMemos.body), JSON.parse(beforeMemos.body),
    'denied writes must not create an author memo');
  assert.equal(afterPublic.body, beforePublic.body,
    'denied publication must not change the anonymous snapshot');
});

test('SSR-CACHE-01/02/03: HTML reader and author routes are no-store, private SSR cannot be cached', async () => {
  const publicPages = [
    '/',
    '/stories/' + fixture.seriesA,
    '/search?series=' + fixture.seriesA,
    '/read/' + fixture.chapter,
    '/items/' + fixture.tip,
    '/studio',
  ];
  for (const path of publicPages) {
    const result = await get(path);
    assert.equal(result.status, 200, 'SSR page ' + path);
    const control = result.headers.get('cache-control') ?? '';
    assert.match(control, /(?:^|[,\\s])no-store(?:[,\\s]|$)/i, 'no-store required on ' + path);
    assert.match(control, /(?:^|[,\\s])private(?:[,\\s]|$)/i, 'private required on ' + path);
  }
  const hidden = await get('/read/' + fixture.scheduled);
  assert.match(hidden.headers.get('cache-control') ?? '', /no-store/i);
  assert.ok(!hidden.body.includes(fixture.prefix + '-scheduled-secret'),
    'SSR cannot expose scheduled chapter name even in an error page');
  for (const origin of [base, api]) {
    const response = await get('/api/public/series', origin);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control') ?? '', /no-store/i,
      'existing API cache protection must hold at ' + origin);
  }
});

test('real API returns no-store responses and unauthenticated session', async () => {
  const response = await get('/api/public/series', api);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const me = await json('/api/auth/me');
  assert.equal(me.value.authenticated, false);
});



test('invalid word meanings reject atomically without changing the published snapshot', async () => {
  const cookie = 'eternalia_author=' + fixture.authorToken;
  async function request(method, path, body) {
    const response = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, value: await response.text() };
  }
  async function create(kind, parentId, title, body = '', details = {}) {
    const response = await request('POST', '/api/admin/nodes', {
      kind, parentId, content: { title, body, details },
    });
    assert.equal(response.status, 201, response.value);
    return JSON.parse(response.value).id;
  }
  const series = await create('series', null, fixture.prefix + '-invalid-word-series');
  const language = await create('language', series, fixture.prefix + '-invalid-word-language');
  const word = await create('word', language, fixture.prefix + '-invalid-word', '公開語', { meanings: '[]' });
  for (const id of [series, language, word]) {
    const result = await request('POST', '/api/admin/nodes/' + id + '/publish', { expectedRevision: 1 });
    assert.equal(result.status, 200, result.value);
  }
  assert.equal((await json('/api/public/items/' + word)).value.content.body, '公開語');

  const rejected = await request('PATCH', '/api/admin/nodes/' + word, {
    expectedRevision: 1,
    content: { title: fixture.prefix + '-invalid-word', body: '漏洩する失敗稿',
      details: { meanings: '[malformed-json' } },
  });
  assert.equal(rejected.status, 400, 'malformed word meanings must be rejected, not persisted');
  const authorNodes = await request('GET', '/api/admin/nodes');
  assert.equal(authorNodes.status, 200);
  const stored = JSON.parse(authorNodes.value).find(node => node.id === word);
  assert.equal(stored?.revision, 1, 'failed validation must not increment revision');
  assert.equal(stored?.draft.body, '公開語', 'failed validation must not change the saved draft');
  assert.equal((await json('/api/public/items/' + word)).value.content.body, '公開語',
    'failed validation must not leak a rejected draft');

  const saved = await request('PATCH', '/api/admin/nodes/' + word, {
    expectedRevision: 1,
    content: { title: fixture.prefix + '-invalid-word', body: '承認された新稿',
      details: { meanings: '[]' } },
  });
  assert.equal(saved.status, 200, saved.value);
  assert.equal((await json('/api/public/items/' + word)).value.content.body, '公開語',
    'valid draft save must still require explicit publication');
  const published = await request('POST', '/api/admin/nodes/' + word + '/publish', {
    expectedRevision: 2,
  });
  assert.equal(published.status, 200, published.value);
  assert.equal((await json('/api/public/items/' + word)).value.content.body, '承認された新稿');
});

test('chapter visibility toggle preserves a newer unpublished draft and public sibling', async () => {
  // AC-34 exploratory HTTP verification; a synthetic author session is not
  // a real Discord OAuth2 acceptance test or a canonical CAT-generated test.
  const cookie = 'eternalia_author=' + fixture.authorToken;
  async function write(method, path, body) {
    const response = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.text() };
  }
  async function create(kind, parentId, title, body = '') {
    const result = await write('POST', '/api/admin/nodes', {
      kind, parentId, content: { title, body, details: {} },
    });
    assert.equal(result.status, 201, result.body);
    return JSON.parse(result.body).id;
  }
  const series = await create('series', null, fixture.prefix + '-ac34-series');
  const volume = await create('volume', series, 'AC34編');
  const part = await create('part', volume, 'AC34部');
  const chapter = await create('chapter', part, 'AC34章', '旧公開本文');
  const sibling = await create('chapter', part, '公開中の兄弟章', '兄弟本文');
  for (const id of [series, volume, part, chapter, sibling]) {
    const published = await write('POST', '/api/admin/nodes/' + id + '/publish',
      { expectedRevision: 1 });
    assert.equal(published.status, 200, published.body);
  }
  assert.equal((await json('/api/public/items/' + chapter)).value.content.body, '旧公開本文');

  const newerDraft = await write('PATCH', '/api/admin/nodes/' + chapter, {
    expectedRevision: 1,
    content: { title: 'AC34章', body: '公開前の新稿', details: {} },
  });
  assert.equal(newerDraft.status, 200, newerDraft.body);
  assert.equal((await json('/api/public/items/' + chapter)).value.content.body, '旧公開本文');

  const hidden = await write('POST', '/api/admin/nodes/' + chapter + '/visibility', {
    expectedRevision: 2, isPublic: false, publicSince: null,
  });
  assert.equal(hidden.status, 200, hidden.body);
  assert.equal((await get('/api/public/items/' + chapter)).status, 404);
  assert.equal((await get('/api/public/items/' + sibling)).status, 200,
    'hiding a chapter must not hide its public sibling');
  const hiddenTree = await json('/api/public/series/' + series + '/tree');
  assert.equal(hiddenTree.status, 200);
  assert.ok(!hiddenTree.value.some(node => node.id === chapter));
  assert.ok(hiddenTree.value.some(node => node.id === sibling));

  const restored = await write('POST', '/api/admin/nodes/' + chapter + '/visibility', {
    expectedRevision: 3, isPublic: true, publicSince: null,
  });
  assert.equal(restored.status, 200, restored.body);
  const reopened = await json('/api/public/items/' + chapter);
  assert.equal(reopened.status, 200);
  assert.equal(reopened.value.content.body, '旧公開本文',
    'reopening visibility must not implicitly publish the newer draft');
  const nodes = await fetch(base + '/api/admin/nodes', { headers: { Cookie: cookie } });
  assert.equal(nodes.status, 200);
  const stored = (await nodes.json()).find(node => node.id === chapter);
  assert.equal(stored?.draft.body, '公開前の新稿',
    'visibility changes must preserve the author draft');
});

test('two published series isolate settings dictionary and timeline descendants', async () => {
  // AC-25 exploratory HTTP/PostgreSQL verification; no year-conversion or
  // real Discord identity semantics are inferred from this test.
  const cookie = 'eternalia_author=' + fixture.authorToken;
  async function write(method, path, body) {
    const response = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.text() };
  }
  async function create(kind, parentId, title, body = '', details = {}) {
    const response = await write('POST', '/api/admin/nodes', {
      kind, parentId, content: { title, body, details },
    });
    assert.equal(response.status, 201, response.body);
    return JSON.parse(response.body).id;
  }
  async function publish(id) {
    const response = await write('POST', '/api/admin/nodes/' + id + '/publish',
      { expectedRevision: 1 });
    assert.equal(response.status, 200, response.body);
  }
  const worlds = [];
  for (const label of ['A', 'B']) {
    const series = await create('series', null, fixture.prefix + '-ac25-' + label);
    const category = await create('category', series, '同名カテゴリ', '', { presets: '[]' });
    const tip = await create('tip', category, '同名設定', label + '-setting');
    const language = await create('language', series, '同名言語', '',
      { characters: '[]', wordClasses: '[]' });
    const word = await create('word', language, '同名単語', label + '-word',
      { meanings: '[]' });
    const period = await create('periodization', series, '同名年代区分');
    const event = await create('event', period, '同名出来事', label + '-event',
      { year: '1' });
    const ids = [series, category, tip, language, word, period, event];
    for (const id of ids) await publish(id);
    worlds.push({ series, category, tip, language, word, period, event, ids });
  }
  const [a, b] = worlds;
  const treeA = await json('/api/public/series/' + a.series + '/tree');
  const treeB = await json('/api/public/series/' + b.series + '/tree');
  assert.equal(treeA.status, 200);
  assert.equal(treeB.status, 200);
  const idsA = new Set(treeA.value.map(node => node.id));
  const idsB = new Set(treeB.value.map(node => node.id));
  for (const id of a.ids) assert.ok(idsA.has(id) && !idsB.has(id), 'A identity leaked: ' + id);
  for (const id of b.ids) assert.ok(idsB.has(id) && !idsA.has(id), 'B identity leaked: ' + id);
  for (const [item, expected] of [
    [a.tip, 'A-setting'], [b.tip, 'B-setting'],
    [a.word, 'A-word'], [b.word, 'B-word'],
    [a.event, 'A-event'], [b.event, 'B-event'],
  ]) {
    const detail = await json('/api/public/items/' + item);
    assert.equal(detail.status, 200);
    assert.equal(detail.value.content.body, expected);
  }

  const hideBCategory = await write('POST', '/api/admin/nodes/' + b.category + '/visibility',
    { expectedRevision: 1, isPublic: false, publicSince: null });
  assert.equal(hideBCategory.status, 200, hideBCategory.body);
  const hiddenB = await json('/api/public/series/' + b.series + '/tree');
  const stillA = await json('/api/public/series/' + a.series + '/tree');
  assert.equal(hiddenB.status, 200);
  assert.equal(stillA.status, 200);
  const visibleB = new Set(hiddenB.value.map(node => node.id));
  const visibleA = new Set(stillA.value.map(node => node.id));
  for (const id of [b.category, b.tip]) assert.ok(!visibleB.has(id));
  for (const id of [b.language, b.word, b.period, b.event]) assert.ok(visibleB.has(id));
  for (const id of a.ids) assert.ok(visibleA.has(id), 'B visibility changed A: ' + id);
  assert.equal((await get('/api/public/items/' + b.tip)).status, 404);
  assert.equal((await get('/api/public/items/' + a.tip)).status, 200);
});

test('nested settings category creation is rejected without altering its parent', async () => {
  // AC-47 exploratory API verification. The author UI's disabled option
  // remains a separate browser acceptance condition.
  const cookie = 'eternalia_author=' + fixture.authorToken;
  async function request(method, path, body) {
    const response = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.text() };
  }
  const seriesResponse = await request('POST', '/api/admin/nodes', {
    kind: 'series', content: { title: fixture.prefix + '-ac47-series', body: '', details: {} },
  });
  assert.equal(seriesResponse.status, 201, seriesResponse.body);
  const series = JSON.parse(seriesResponse.body).id;
  const categoryResponse = await request('POST', '/api/admin/nodes', {
    kind: 'category', parentId: series,
    content: { title: '元のカテゴリ', body: '旧説明', details: { presets: '[]' } },
  });
  assert.equal(categoryResponse.status, 201, categoryResponse.body);
  const category = JSON.parse(categoryResponse.body).id;
  const edited = await request('PATCH', '/api/admin/nodes/' + category, {
    expectedRevision: 1,
    content: { title: '更新済みカテゴリ', body: '保存された説明',
      details: { presets: '[]' } },
  });
  assert.equal(edited.status, 200, edited.body);
  const before = await request('GET', '/api/admin/nodes');
  assert.equal(before.status, 200);
  const stored = JSON.parse(before.body).find(node => node.id === category);
  assert.equal(stored?.revision, 2);
  assert.equal(stored?.draft.body, '保存された説明');

  const rejected = await request('POST', '/api/admin/nodes', {
    kind: 'category', parentId: category,
    content: { title: '作成してはいけない子カテゴリ', body: '', details: { presets: '[]' } },
  });
  assert.equal(rejected.status, 400, 'category nesting must fail at the real HTTP boundary');
  const after = await request('GET', '/api/admin/nodes');
  assert.equal(after.status, 200);
  assert.deepEqual(JSON.parse(after.body), JSON.parse(before.body),
    'rejected nesting must not change the parent or create any node');
});

test('invalid category preset edits are atomic and future tips use the latest valid preset', async () => {
  // ST-03/AC-49/50 exploratory PostgreSQL HTTP boundary verification.
  const cookie = 'eternalia_author=' + fixture.authorToken;
  async function request(method, path, body) {
    const response = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.text() };
  }
  async function create(kind, parentId, title, details = {}) {
    const result = await request('POST', '/api/admin/nodes', {
      kind, parentId, content: { title, body: '', details },
    });
    assert.equal(result.status, 201, result.body);
    return JSON.parse(result.body).id;
  }
  async function nodes() {
    const response = await request('GET', '/api/admin/nodes');
    assert.equal(response.status, 200);
    return JSON.parse(response.body);
  }
  const preset = (title, body) => JSON.stringify([{ title, body }]);
  const series = await create('series', null, fixture.prefix + '-preset-atomic');
  const category = await create('category', series, 'カテゴリ',
    { presets: preset('初期見出し', '初期本文') });
  const oldTip = await create('tip', category, '既存設定');
  const before = await nodes();
  const oldSection = before.find(node => node.kind === 'tipSection' && node.parentId === oldTip);
  assert.ok(oldSection);
  assert.equal(oldSection.draft.title, '初期見出し');

  const invalid = await request('PATCH', '/api/admin/nodes/' + category, {
    expectedRevision: 1,
    content: { title: '変更してはいけないカテゴリ', body: '失敗本文',
      details: { presets: '{invalid-json' } },
  });
  assert.equal(invalid.status, 400);
  const afterFailure = await nodes();
  assert.deepEqual(afterFailure, before,
    'invalid category presets must not change the saved category or existing sections');

  const valid = await request('PATCH', '/api/admin/nodes/' + category, {
    expectedRevision: 1,
    content: { title: 'カテゴリ', body: '',
      details: { presets: preset('更新後の見出し', '更新後の本文') } },
  });
  assert.equal(valid.status, 200, valid.body);
  const newTip = await create('tip', category, '新規設定');
  const afterSuccess = await nodes();
  const originalSection = afterSuccess.find(node => node.id === oldSection.id);
  const newSection = afterSuccess.find(node => node.kind === 'tipSection' && node.parentId === newTip);
  assert.deepEqual(originalSection, oldSection,
    'a successful preset change must not rewrite existing TipSections');
  assert.equal(newSection?.draft.title, '更新後の見出し');
  assert.equal(newSection?.draft.body, '更新後の本文');
  assert.equal(afterSuccess.find(node => node.id === category)?.revision, 2);
});

test('recent publications retain cross-domain privacy after hiding an ancestor', async () => {
  // AC-55 exploratory API/PostgreSQL verification for settings, words, events.
  const cookie = 'eternalia_author=' + fixture.authorToken;
  async function write(method, path, body) {
    const response = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.text() };
  }
  async function create(kind, parentId, title, body = '', details = {}) {
    const response = await write('POST', '/api/admin/nodes', {
      kind, parentId, content: { title, body, details },
    });
    assert.equal(response.status, 201, response.body);
    return JSON.parse(response.body).id;
  }
  async function publish(id) {
    const response = await write('POST', '/api/admin/nodes/' + id + '/publish',
      { expectedRevision: 1 });
    assert.equal(response.status, 200, response.body);
  }
  async function recent() {
    const response = await json('/api/public/recent');
    assert.equal(response.status, 200);
    return response.value;
  }
  const series = await create('series', null, fixture.prefix + '-recent-multidomain');
  const category = await create('category', series, '公開カテゴリ', '',
    { presets: '[]' });
  const tip = await create('tip', category, '新着設定', '公開設定本文');
  const language = await create('language', series, '公開言語', '',
    { characters: '[]', wordClasses: '[]' });
  const word = await create('word', language, '新着単語', '公開単語本文',
    { meanings: '[]' });
  const period = await create('periodization', series, '公開年代区分');
  const event = await create('event', period, '新着出来事', '公開出来事本文',
    { year: '1' });
  for (const id of [series, category, tip, language, word, period, event]) await publish(id);
  const initial = await recent();
  for (const id of [tip, word, event]) {
    assert.ok(initial.some(node => node.id === id), 'missing public recent entry ' + id);
  }

  const draft = await write('PATCH', '/api/admin/nodes/' + word, {
    expectedRevision: 1,
    content: { title: '非公開の単語改訂', body: '未公開の本文',
      details: { meanings: '[]' } },
  });
  assert.equal(draft.status, 200, draft.body);
  const afterDraft = await recent();
  assert.equal(afterDraft.find(node => node.id === word)?.content.body, '公開単語本文',
    'recent must show published snapshot rather than the latest draft');

  // PB-05/AC-54 partial: scheduling a future word must hide it from recent
  // without changing the published snapshot; boundary-second semantics remain undecided.
  const scheduled = await write('POST', '/api/admin/nodes/' + word + '/visibility', {
    expectedRevision: 2, isPublic: true, publicSince: Date.now() + 86_400_000,
  });
  assert.equal(scheduled.status, 200, scheduled.body);
  const scheduledRecent = await recent();
  assert.ok(!scheduledRecent.some(node => node.id === word),
    'a future-scheduled word must be absent from recent');
  assert.ok(scheduledRecent.some(node => node.id === event),
    'scheduling a word must not hide an unrelated event');
  const unscheduled = await write('POST', '/api/admin/nodes/' + word + '/visibility', {
    expectedRevision: 3, isPublic: true, publicSince: null,
  });
  assert.equal(unscheduled.status, 200, unscheduled.body);
  const restoredRecent = await recent();
  assert.equal(restoredRecent.find(node => node.id === word)?.content.body, '公開単語本文',
    'clearing a future schedule must restore the old published version');

  const hiddenCategory = await write('POST', '/api/admin/nodes/' + category + '/visibility',
    { expectedRevision: 1, isPublic: false, publicSince: null });
  assert.equal(hiddenCategory.status, 200, hiddenCategory.body);
  const afterCategory = await recent();
  assert.ok(!afterCategory.some(node => node.id === tip));
  for (const id of [word, event]) assert.ok(afterCategory.some(node => node.id === id));

  const hiddenSeries = await write('POST', '/api/admin/nodes/' + series + '/visibility',
    { expectedRevision: 1, isPublic: false, publicSince: null });
  assert.equal(hiddenSeries.status, 200, hiddenSeries.body);
  const afterSeries = await recent();
  for (const id of [tip, word, event]) {
    assert.ok(!afterSeries.some(node => node.id === id),
      'private series must hide recent descendant ' + id);
  }
});

/**
 * A synthetic database session exercises the full Nest guard and persistence
 * boundary. This intentionally does NOT test Discord's real OAuth2 exchange.
 */
test('AC-06: cross-series related Tip PATCH is rejected atomically at the HTTP boundary', async () => {
  const cookie = 'eternalia_author=' + fixture.authorToken;
  async function request(method, path, body) {
    const response = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.text() };
  }
  async function create(kind, parentId, suffix) {
    const response = await request('POST', '/api/admin/nodes', {
      kind, parentId,
      content: { title: fixture.prefix + '-related-http-' + suffix, body: suffix, details: {} },
    });
    assert.equal(response.status, 201, response.body);
    return JSON.parse(response.body).id;
  }
  const seriesA = await create('series', null, 'series-A');
  const seriesB = await create('series', null, 'series-B');
  const categoryA = await create('category', seriesA, 'category-A');
  const categoryB = await create('category', seriesB, 'category-B');
  const source = await create('tip', categoryA, 'source');
  const foreignTarget = await create('tip', categoryB, 'foreign-target');
  const before = await request('GET', '/api/admin/nodes');
  assert.equal(before.status, 200);
  const beforeNodes = JSON.parse(before.body);
  assert.equal(beforeNodes.find(node => node.id === source)?.revision, 1);

  const rejected = await request('PATCH', '/api/admin/nodes/' + source, {
    expectedRevision: 1,
    content: {
      title: fixture.prefix + '-related-http-source',
      body: 'must-not-persist',
      details: { relatedTipIds: JSON.stringify([foreignTarget]) },
    },
  });
  assert.equal(rejected.status, 400, 'a cross-series Tip relation must fail through Nuxt/Nest');
  const after = await request('GET', '/api/admin/nodes');
  assert.equal(after.status, 200);
  assert.deepEqual(JSON.parse(after.body), beforeNodes,
    'rejected cross-series relation must not mutate any author node or revision');
});

test('stale publish and visibility writes return 409 without changing public content', async () => {
  // Synthetic author session; real Discord OAuth2 remains a separate gate.
  const cookie = 'eternalia_author=' + fixture.authorToken;
  async function write(method, path, body) {
    const response = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.text() };
  }
  async function create(kind, parentId, title, body = '') {
    const response = await write('POST', '/api/admin/nodes', {
      kind, parentId, content: { title, body, details: {} },
    });
    assert.equal(response.status, 201, response.body);
    return JSON.parse(response.body).id;
  }

  const series = await create('series', null, fixture.prefix + '-revision-series');
  const volume = await create('volume', series, '改訂巻');
  const part = await create('part', volume, '改訂部');
  const chapter = await create('chapter', part, '改訂章', '公開済み本文');
  for (const id of [series, volume, part, chapter]) {
    const published = await write('POST', '/api/admin/nodes/' + id + '/publish',
      { expectedRevision: 1 });
    assert.equal(published.status, 200, published.body);
  }
  assert.equal((await json('/api/public/items/' + chapter)).value.content.body, '公開済み本文');

  const saved = await write('PATCH', '/api/admin/nodes/' + chapter, {
    expectedRevision: 1,
    content: { title: '改訂章', body: '改訂後本文', details: {} },
  });
  assert.equal(saved.status, 200, saved.body);
  const stalePublish = await write('POST', '/api/admin/nodes/' + chapter + '/publish',
    { expectedRevision: 1 });
  assert.equal(stalePublish.status, 409);
  assert.equal((await json('/api/public/items/' + chapter)).value.content.body, '公開済み本文');

  const currentPublish = await write('POST', '/api/admin/nodes/' + chapter + '/publish',
    { expectedRevision: 2 });
  assert.equal(currentPublish.status, 200, currentPublish.body);
  const staleVisibility = await write('POST', '/api/admin/nodes/' + chapter + '/visibility',
    { expectedRevision: 1, isPublic: false, publicSince: null });
  assert.equal(staleVisibility.status, 409);
  assert.equal((await json('/api/public/items/' + chapter)).value.content.body, '改訂後本文');

  const futurePublish = await write('POST', '/api/admin/nodes/' + chapter + '/publish',
    { expectedRevision: 999999 });
  assert.equal(futurePublish.status, 409, 'future revision cannot publish');
  const futureVisibility = await write('POST', '/api/admin/nodes/' + chapter + '/visibility',
    { expectedRevision: 999999, isPublic: false, publicSince: null });
  assert.equal(futureVisibility.status, 409, 'future revision cannot hide public content');
  assert.equal((await json('/api/public/items/' + chapter)).value.content.body, '改訂後本文');
});

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
