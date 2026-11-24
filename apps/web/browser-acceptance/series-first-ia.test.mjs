/** Issue #165, IA-01..09: exploratory Nuxt browser acceptance on disposable PostgreSQL.
 * This test is not a CAT-generated gate and does not certify the v0.3 visual design.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
assert.match(base ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);

test('IA-01/02/03: readers select a series before its four content domains', { timeout: 60_000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.locator('main').getByRole('heading', { name: '公開シリーズ' }).waitFor();
    await page.getByRole('link', { name: fixture.prefix + '-world-A', exact: true }).first().waitFor();
    assert.equal(await page.locator('#global-navigation a[href="/stories"], #global-navigation a[href="/tips"], #global-navigation a[href="/dictionaries"], #global-navigation a[href="/timeline"]').count(), 0,
      'unselected domain areas must not be global content categories');
    const topLevelLinks = await page.locator('#global-navigation a').evaluateAll(elements =>
      elements.map(element => element.getAttribute('href')));
    assert.ok(topLevelLinks.includes('/') && topLevelLinks.includes('/search'));

    await page.goto(base + '/series/' + fixture.seriesA);
    await page.getByRole('heading', { name: fixture.prefix + '-world-A', exact: true }).waitFor();
    for (const area of ['stories','settings','dictionaries','timeline']) {
      await page.locator('#global-navigation a[href="/series/' + fixture.seriesA + '/' + area + '"]').waitFor();
      await page.locator('main a[href="/series/' + fixture.seriesA + '/' + area + '"]').first().waitFor();
      assert.equal(await page.locator('main .reader-list a[href="/' + area + '"]').count(), 0);
    }
    assert.equal(await page.locator('main .reader-list a[href^="/read/"]').count(), 0,
      'series introduction must not flatten all authored content types into its own listing');

    await page.goto(base + '/series/' + fixture.seriesA + '/stories');
    const crumbs = await page.locator('main nav.topic-path a').allInnerTexts();
    assert.equal(crumbs[0], 'ホーム');
    assert.ok(crumbs.some(value => value.includes(fixture.prefix + '-world-A')));
    await context.close();
  } finally { await browser.close(); }
});

test('IA-05/06/07: author editing and publication each require their own series/area context', { timeout: 60_000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addCookies([{
      name: 'eternalia_author', value: fixture.authorToken, url: base,
      httpOnly: true, sameSite: 'Lax',
    }]);
    const page = await context.newPage();
    await page.goto(base + '/studio');
    await page.getByRole('heading', { name: '執筆・編集' }).waitFor();
    assert.equal(await page.locator('.studio-sidebar li').count(), 0,
      'edit library must not merge items from every series before selection');
    await page.getByLabel('シリーズを選択').selectOption(fixture.seriesA);
    await page.getByRole('button', { name: '執筆' }).first().waitFor();
    assert.equal(await page.locator('.studio-sidebar').innerText()
      .then(value => value.includes(fixture.prefix + '-visible-setting')), false,
      'story editing tree must not mix settings nodes');
    await page.getByRole('button', { name: '設定' }).first().click();
    await page.locator('.studio-sidebar .node-button').filter({hasText:fixture.prefix + '-visible-setting'}).waitFor();
    await page.getByRole('button', { name: '項目を追加', exact: true }).click();
    await page.locator('form.create-form select').waitFor();
    assert.equal(await page.locator('form.create-form select').inputValue(), 'category',
      'creating from the settings domain must propose a series-owned category');
    await page.getByRole('button', { name: 'キャンセル', exact: true }).click();

    // Switching editing domains must not leave the previous domain's editor
    // visible under an unrelated filter.
    await page.goto(base + '/studio?item=' + fixture.chapter);
    const selectedChapterHeading = page.locator('.studio-editor h2').filter({ hasText: /^章：/ });
    await selectedChapterHeading.waitFor();
    // Earlier acceptance suites may legitimately rename this seeded draft.
    // Assert the restored kind and stable item identity, not an obsolete title.
    const chapterHeadingText = await selectedChapterHeading.innerText();
    assert.match(chapterHeadingText, /^章：/);
    await page.locator('.studio-editor button').filter({hasText:'公開'}).first().waitFor();
    await page.getByRole('group', { name: '資料種別' })
      .getByRole('button', { name: '設定', exact: true }).click();
    assert.equal(await page.getByRole('heading', {
      name: chapterHeadingText, exact: true,
    }).count(), 0, 'domain change must clear the previous chapter editing scope');

    await page.goto(base + '/studio/publication');
    await page.getByRole('heading', { name: '公開管理' }).waitFor();
    assert.equal(await page.locator('.publication-row').count(), 0,
      'publication page must require a series before listing records');
    await page.getByLabel('シリーズを選択').selectOption(fixture.seriesA);
    await page.getByLabel('領域').selectOption('tips');
    const visibleTip = page.locator('.publication-row').filter({
      has: page.getByRole('heading', { name: fixture.prefix + '-visible-setting', exact: true }),
    });
    await visibleTip.waitFor();
    assert.equal(await page.locator('.publication-list').innerText()
      .then(value => value.includes(fixture.prefix + '-world-B')), false,
      'other series must not enter this management scope');

    await page.goto(base + '/studio/publication?series=' + fixture.seriesA + '&target=' + fixture.word);
    await page.getByRole('heading', { name: '公開管理' }).waitFor();
    await page.waitForFunction(() => document.querySelectorAll('.publication-filters select')[1]?.value === 'dictionaries',
      null, { timeout: 5000 });
    assert.equal(await page.getByLabel('領域').inputValue(), 'dictionaries',
      'publication deep link must select the edited item domain');
    await page.locator('.publication-row').filter({
      has: page.locator('a[href*="item=' + fixture.word + '"]'),
    }).waitFor();
    assert.equal(await page.locator('#global-navigation a[href="/stories/' + fixture.seriesA + '"]').count(), 0,
      'author publication scope must not become the global public-reader navigation scope');
    await context.close();
  } finally { await browser.close(); }
});

test('NAV-1/2/3/4: mobile menus are independent overlays and locale selection is explicit', { timeout: 60_000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.getByRole('heading', { name: '公開シリーズ' }).waitFor();
    assert.equal(await page.locator('#global-navigation a[href="/admin"]').count(), 0);
    assert.equal(await page.locator('.site-footer a[href="/admin"]').count(), 0);
    const header = page.locator('.site-header');
    const before = (await header.boundingBox()).height;
    const mainMenu = page.getByRole('button', { name: 'メインメニュー' });
    const updateMenu = page.getByRole('button', { name: '新着・更新メニュー' });
    await mainMenu.click();
    assert.equal(await page.locator('#global-navigation').isVisible(), true);
    assert.ok(Math.abs((await header.boundingBox()).height - before) <= 1,
      'opening main menu must not resize the header');
    assert.equal(await page.locator('#updates-aside').isVisible(), false);
    await updateMenu.click();
    assert.equal(await page.locator('#global-navigation').isVisible(), false);
    assert.equal(await page.locator('#updates-aside').isVisible(), true);
    assert.ok(Math.abs((await header.boundingBox()).height - before) <= 1,
      'opening the separate update panel must not resize the header');
    await page.getByRole('button', { name: '表示言語を選択' }).click();
    const languageMenu = page.locator('#language-list');
    await languageMenu.getByRole('button', { name: '日本語' }).waitFor();
    await languageMenu.getByRole('button', { name: 'English' }).click();
    await page.locator('html[lang="en"]').waitFor();
    assert.equal(await languageMenu.count(), 0, 'selection closes the language menu');
    assert.ok(Math.abs((await header.boundingBox()).height - before) <= 1,
      'language selection must not resize the header');
    await context.close();
  } finally { await browser.close(); }
});

test('IA-04: canonical detail breadcrumbs include the domain level, not only entity ancestry', { timeout: 60_000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const chapter = '/series/' + fixture.seriesA + '/stories/' + fixture.volume +
      '/parts/' + fixture.part + '/chapters/' + fixture.chapter;
    await page.goto(base + chapter);
    await page.getByRole('heading', { name: fixture.prefix + '-chapter-A' }).waitFor();
    assert.equal(await page.locator('main .topic-path a[href="/series/' + fixture.seriesA + '/stories"]').innerText(), 'ストーリー');
    await page.goto(base + '/series/' + fixture.seriesA + '/settings/' + fixture.category + '/' + fixture.tip);
    await page.getByRole('heading', { name: fixture.prefix + '-visible-setting' }).waitFor();
    assert.equal(await page.locator('main .topic-path a[href="/series/' + fixture.seriesA + '/settings"]').innerText(), '設定集');
  } finally { await browser.close(); }
});

test('UI-3: cancellation in the shared in-document dialog does not publish an author draft', { timeout: 60_000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.addCookies([{ name:'eternalia_author', value:fixture.authorToken,
      url:base, httpOnly:true, sameSite:'Lax' }]);
    const page = await context.newPage();
    const url = base + '/studio?item=' + fixture.tip;
    await page.goto(url);
    await page.getByRole('heading', { name: fixture.prefix + '-visible-setting' }).waitFor();
    const snapshot = page.locator('.publication-editor').getByRole('button', {
      name: '保存済み下書きを公開版へ反映',
    });
    await snapshot.click();
    await page.locator('dialog[open]').waitFor();
    await page.locator('dialog[open]').getByRole('button', { name: 'キャンセル' }).click();
    await page.locator('dialog[open]').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.status-success').filter({ hasText: '公開スナップショットを更新しました。' }).count(), 0);
    await context.close();
  } finally { await browser.close(); }
});

test('AC-94: bulk visibility is scoped to one series and reports conflicts and unverified readback', { timeout: 90000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.addCookies([{ name: 'eternalia_author', value: fixture.authorToken,
      url: base, httpOnly: true, sameSite: 'Lax' }]);
    const reader = await browser.newContext();
    const page = await context.newPage();
    const prefix = 'batch-' + randomUUID();
    const headers = { Origin: base };
    async function create(kind, parentId, suffix) {
      const response = await context.request.post(base + '/api/admin/nodes', {
        headers, data: { kind, parentId, content: { title: prefix + '-' + suffix, body: '', details: {} } },
      });
      assert.equal(response.status(), 201, await response.text());
      const node = await response.json();
      const published = await context.request.post(base + '/api/admin/nodes/' + node.id + '/publish', {
        headers, data: { expectedRevision: 1 },
      });
      assert.equal(published.status(), 200, await published.text());
      return node.id;
    }
    const series = await create('series', null, 'series');
    const category = await create('category', series, 'category');
    const first = await create('tip', category, 'first');
    const second = await create('tip', category, 'second');
    const foreignSeries = await create('series', null, 'foreign-series');
    const foreignCategory = await create('category', foreignSeries, 'foreign-category');
    const foreign = await create('tip', foreignCategory, 'foreign');
    const publicStatus = async id => (await reader.request.get(base + '/api/public/items/' + id)).status();
    const nodes = async () => {
      const response = await context.request.get(base + '/api/admin/nodes');
      assert.equal(response.status(), 200);
      return await response.json();
    };

    await page.goto(base + '/admin/series/' + series + '/publication');
    await page.getByLabel('シリーズを選択').locator('option[value="' + series + '"]').waitFor({ state: 'attached' });
    await page.waitForFunction(id => document.querySelector('.publication-filters select')?.value === id, series);
    await page.getByLabel('領域').selectOption('tips');
    const check = id => page.locator('.publication-row input[type="checkbox"][value="' + id + '"]');
    await check(first).waitFor();
    await check(second).waitFor();
    assert.equal(await check(foreign).count(), 0);
    assert.equal(await publicStatus(first), 200);
    assert.equal(await publicStatus(second), 200);
    assert.equal(await publicStatus(foreign), 200);
    await check(first).check();
    await check(second).check();
    const oldSecond = (await nodes()).find(node => node.id === second);
    const external = await context.request.patch(base + '/api/admin/nodes/' + second, {
      headers, data: { expectedRevision: oldSecond.revision,
        content: { ...oldSecond.draft, title: prefix + '-second-revised' } },
    });
    assert.equal(external.status(), 200, await external.text());
    await page.getByRole('button', { name: '選択項目を非公開', exact: true }).click();
    await page.getByText('変更完了件数 1', { exact: true }).waitFor();
    await page.locator('main [role="alert"]').filter({ hasText: prefix + '-second' }).waitFor();
    assert.equal(await publicStatus(first), 404);
    assert.equal(await publicStatus(second), 200);
    assert.equal(await publicStatus(foreign), 200);
    assert.equal((await nodes()).find(node => node.id === second).draft.title, prefix + '-second-revised');

    // The next operation itself succeeds, but its management readback fails.
    // Do not display a verified success count for stale management data.
    await check(first).check();
    await page.route('**/api/admin/nodes', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"readback failed"}' });
      } else await route.continue();
    });
    await page.getByRole('button', { name: '選択項目を公開', exact: true }).click();
    await page.getByText('公開管理データを取得できません。', { exact: true }).waitFor();
    assert.equal(await page.getByText('変更完了件数 1', { exact: true }).count(), 0);
    assert.equal(await publicStatus(first), 200, 'write did succeed despite failed readback');
    assert.equal(await publicStatus(foreign), 200);
    await reader.close();
    await context.close();
  } finally { await browser.close(); }
});

/** IA-05/06 observations; exploratory browser reproduction, not a CAT Gate.
 * The approved hierarchy requires actual navigable links, not just routable URLs.
 * Canonical edit identity must not be displaced by legacy Studio query inputs.
 */
async function withCanonicalAuthor(run) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.addCookies([{ name:'eternalia_author', value:fixture.authorToken,
      url:base, httpOnly:true, sameSite:'Lax' }]);
    const response = await context.request.get(base + '/api/admin/nodes');
    assert.equal(response.status(), 200);
    const nodes = await response.json();
    const page = await context.newPage();
    await run(page, nodes);
    await context.close();
  } finally { await browser.close(); }
}
const canonicalAdmin = '/admin/series/' + fixture.seriesA;
const chapterEdit = canonicalAdmin + '/stories/chapters/' + fixture.chapter + '/edit';
const chapterPreview = canonicalAdmin + '/stories/chapters/' + fixture.chapter + '/preview';

test('IA-05: series management grid provides an actual link to the selected series areas', { timeout: 30_000 }, async () => {
  await withCanonicalAuthor(async (page, nodes) => {
    const title = nodes.find(n => n.id === fixture.seriesA).draft.title;
    await page.goto(base + '/admin');
    await page.locator('main a[href="/admin/series"]').click();
    const row = page.locator('.admin-node-grid tr').filter({ has:page.getByRole('rowheader', { name:title, exact:true }) });
    await row.waitFor();
    await row.locator('a[href="' + canonicalAdmin + '"]').click({ timeout:5000 });
    for (const area of ['stories','settings','dictionaries','timeline','publication']) {
      await page.locator('main a[href="' + canonicalAdmin + '/' + area + '"]').waitFor();
    }
  });
});

test('IA-05: chapter editor can reach its independent saved-draft preview and return', { timeout: 30_000 }, async () => {
  await withCanonicalAuthor(async (page, nodes) => {
    const title = nodes.find(n => n.id === fixture.chapter).draft.title;
    await page.goto(base + chapterEdit);
    await page.locator('.studio-editor').getByRole('heading', {name:'章：' + title, exact:true}).waitFor();
    await page.locator('main a[href="' + chapterPreview + '"]').click({ timeout:5000 });
    await page.getByRole('heading', {name:title, exact:true}).waitFor();
    await page.locator('main a[href="' + chapterEdit + '"]').click();
    await page.locator('.studio-editor').getByRole('heading', {name:'章：' + title, exact:true}).waitFor();
  });
});

test('IA-06: legacy item query must not replace the validated canonical edit identity', { timeout: 30_000 }, async () => {
  await withCanonicalAuthor(async (page, nodes) => {
    const title = nodes.find(n => n.id === fixture.chapter).draft.title;
    const foreignTitle = nodes.find(n => n.id === fixture.languageB).draft.title;
    await page.goto(base + chapterEdit + '?item=' + encodeURIComponent(fixture.languageB));
    await page.locator('.studio-editor').getByRole('heading', {name:'章：' + title, exact:true}).waitFor({timeout:5000});
    assert.equal(await page.locator('.studio-editor h2').filter({hasText:foreignTitle}).count(),0);
  });
});

test('IA-06: legacy create query must not replace a canonical edit with a create form', { timeout: 30_000 }, async () => {
  await withCanonicalAuthor(async (page, nodes) => {
    const title = nodes.find(n => n.id === fixture.chapter).draft.title;
    await page.goto(base + chapterEdit + '?create=language&parent=' + encodeURIComponent(fixture.seriesB));
    await page.locator('.studio-editor').getByRole('heading', {name:'章：' + title, exact:true}).waitFor({timeout:5000});
    assert.equal(await page.locator('form.create-form').count(),0);
  });
});
