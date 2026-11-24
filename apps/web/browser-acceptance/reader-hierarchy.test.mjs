/** W03 / AC-79,80,82,92,95: read-only exploratory verification.
 * Runs against the fresh disposable HTTP acceptance fixture before author mutations.
 * This is not a generated CAT Gate or manual acceptance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

assert.equal(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB, '1');
assert.notEqual(process.env.NODE_ENV, 'production');
const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
assert.match(base ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);
const root = '/series/' + fixture.seriesA;
const foreign = '/series/' + fixture.seriesB;
const story = root + '/stories';
const volume = story + '/' + fixture.volume;
const part = volume + '/parts/' + fixture.part;
const chapter = part + '/chapters/' + fixture.chapter;
const settings = root + '/settings';
const category = settings + '/' + fixture.category;
const tip = category + '/' + fixture.tip;
const dictionaries = root + '/dictionaries';
const language = dictionaries + '/' + fixture.language;
const timeline = root + '/timeline';
const period = timeline + '/periods/' + fixture.period;
const event = period + '/events/' + fixture.event;

async function withReader(run) {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage();
    await page.goto(base + '/');
    await page.locator('main a[href="' + root + '"]').first().waitFor();
    await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
    await run(page);
  } finally { await browser.close(); }
}
async function clickPath(page, path, title) {
  const link = page.locator('main a[href="' + path + '"]').first();
  await link.waitFor();
  await link.click();
  await page.waitForURL(url => url.pathname === path);
  if (title) await page.locator('main').getByRole('heading', {name: title, exact: true}).waitFor();
  assert.equal(await page.locator('main [role="alert"]').count(), 0, path);
}
const title = suffix => fixture.prefix + '-' + suffix;

test('AC-79/92: actual links traverse story hierarchy and exclude the scheduled chapter', {timeout: 90000}, async () => {
  await withReader(async page => {
    await clickPath(page, root, title('world-A'));
    await clickPath(page, story, 'ストーリー');
    await clickPath(page, volume, title('book-A'));
    await clickPath(page, part, title('part-A'));
    assert.equal(await page.locator('main a[href="' + part + '/chapters/' + fixture.scheduled + '"]').count(), 0);
    await clickPath(page, chapter, title('chapter-A'));
    assert.ok((await page.locator('main').innerText()).includes(title('published-body')));
    assert.ok(!(await page.locator('main').innerText()).includes(title('unpublished-draft-body')));
    const nav = page.locator('main .chapter-navigation');
    await nav.waitFor();
    assert.equal(await nav.locator('a').count(), 1, 'only the contents link, no hidden next chapter');
    assert.equal(await nav.locator('a').getAttribute('href'), story);
    await page.goBack();
    await page.waitForURL(url => url.pathname === part);
    await page.locator('main').getByRole('heading', {name: title('part-A'), exact:true}).waitFor();
  });
});

test('AC-80/95: actual links traverse settings, dictionary and timeline', {timeout: 90000}, async () => {
  await withReader(async page => {
    await clickPath(page, root, title('world-A'));
    await clickPath(page, settings, '設定集');
    assert.equal(await page.locator('main a[href="' + settings + '/' + fixture.hiddenCategory + '"]').count(), 0);
    await clickPath(page, category, title('visible-category'));
    assert.equal(await page.locator('main a[href="' + category + '/' + fixture.unpublishedTip + '"]').count(), 0);
    await clickPath(page, tip, title('visible-setting'));

    await page.goto(base + root);
    await clickPath(page, dictionaries, '辞書');
    await clickPath(page, language, title('visible-language'));
    await clickPath(page, language + '/details', title('visible-language'));
    await page.goBack();
    await page.waitForURL(url => url.pathname === language);
    await clickPath(page, language + '/words/' + fixture.word, title('visible-word'));
    await page.goBack();
    await page.waitForURL(url => url.pathname === language);
    await clickPath(page, language + '/grammar/' + fixture.grammar, title('visible-grammar'));

    await page.goto(base + root);
    await clickPath(page, timeline);
    await page.locator('main .period-filter select').selectOption(fixture.period);
    await clickPath(page, period, title('visible-period'));
    await page.goBack();
    await page.waitForURL(url => url.pathname === timeline);
    await clickPath(page, event, title('visible-event'));
  });
});

test('AC-82/95: wrong ancestor or series cannot open a canonical item and legacy area URLs redirect', {timeout: 90000}, async () => {
  await withReader(async page => {
    for (const path of [
      foreign + '/stories/' + fixture.volume,
      story + '/' + fixture.category + '/parts/' + fixture.part + '/chapters/' + fixture.chapter,
      settings + '/' + fixture.hiddenCategory + '/' + fixture.tip,
      dictionaries + '/' + fixture.languageB + '/words/' + fixture.word,
      foreign + '/timeline/periods/' + fixture.period + '/events/' + fixture.event,
      part + '/chapters/' + fixture.scheduled,
      category + '/' + fixture.unpublishedTip,
    ]) {
      await page.goto(base + path);
      await page.locator('main [role="alert"]').waitFor();
      assert.equal(await page.locator('main article').count(), 0, path);
      const body = await page.locator('main').innerText();
      for (const secret of ['published-body', 'unpublished-draft-body', 'private-content', 'visible-word-body', 'visible-event-body']) {
        assert.ok(!body.includes(title(secret)), path + ' rendered a body outside its canonical scope');
      }
    }
    for (const [legacy, canonical] of [
      ['/stories/', story], ['/tips/', settings], ['/dictionaries/', dictionaries], ['/timeline/', timeline],
    ]) {
      await page.goto(base + legacy + fixture.seriesA);
      await page.waitForURL(url => url.pathname === canonical);
    }
  });
});
