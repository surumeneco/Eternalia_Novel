/** Issue #165, IA-01..09: exploratory Nuxt browser acceptance on disposable PostgreSQL.
 * This test is not a CAT-generated gate and does not certify the v0.3 visual design.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

    await page.goto(base + '/stories/' + fixture.seriesA);
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
    await page.getByText(fixture.prefix + '-visible-setting').first().waitFor();
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
