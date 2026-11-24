/** AC-56/CM-09: reader detail -> author edit deep-link, synthetic auth only. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

assert.equal(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB, '1');
assert.notEqual(process.env.NODE_ENV, 'production');
const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
assert.match(base ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);

const rows = [
  { id: fixture.chapter, publicPath: '/read/', publishedTitle: fixture.prefix + '-chapter-A',
    group: 'stories/chapters', kind: '章', draftTitle: fixture.prefix + '-unpublished-draft-title' },
  { id: fixture.tip, publicPath: '/items/', publishedTitle: fixture.prefix + '-visible-setting',
    group: 'settings/tips', kind: '設定', draftTitle: fixture.prefix + '-visible-setting' },
  { id: fixture.word, publicPath: '/items/', publishedTitle: fixture.prefix + '-visible-word',
    group: 'dictionaries/words', kind: '単語', draftTitle: fixture.prefix + '-visible-word' },
  { id: fixture.grammar, publicPath: '/items/', publishedTitle: fixture.prefix + '-visible-grammar',
    group: 'dictionaries/grammar', kind: '文法', draftTitle: fixture.prefix + '-visible-grammar' },
  { id: fixture.event, publicPath: '/items/', publishedTitle: fixture.prefix + '-visible-event',
    group: 'timeline/events', kind: '出来事', draftTitle: fixture.prefix + '-visible-event' },
];

test('AC-56: reader item links reach the exact authorized Studio editor without leaking edit controls to anonymous readers',
  { timeout: 120_000 }, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const anonymous = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const anon = await anonymous.newPage();
      for (const row of rows) {
        await anon.goto(base + row.publicPath + row.id);
        await anon.getByRole('heading', { name: row.publishedTitle }).waitFor();
        assert.equal(await anon.getByRole('link', { name: 'この項目を編集' }).count(), 0,
          'anonymous reader must not see author editing controls for ' + row.kind);
      }
      await anon.goto(base + '/admin/series/' + fixture.seriesA + '/dictionaries/words/' + fixture.word + '/edit');
      await anon.getByText('編集するには、許可された作者のDiscordアカウントで認証してください。',
        { exact: false }).waitFor();
      assert.equal(await anon.locator('.studio-editor form').count(), 0);
      await anonymous.close();

      const author = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await author.addCookies([{
        name: 'eternalia_author', value: fixture.authorToken, url: base,
        httpOnly: true, sameSite: 'Lax',
      }]);
      const page = await author.newPage();
      for (const row of rows) {
        await page.goto(base + row.publicPath + row.id);
        await page.getByRole('heading', { name: row.publishedTitle }).waitFor();
        const editLink = page.getByRole('link', { name: 'この項目を編集' });
        await editLink.waitFor();
        const href = await editLink.getAttribute('href');
        assert.ok(href, 'missing deep-link URL');
        const url = new URL(href, base);
        const expected = '/admin/series/' + fixture.seriesA + '/' + row.group + '/' + row.id + '/edit';
        assert.equal(url.pathname, expected);
        assert.equal(url.search, '');
        await editLink.click();
        await page.waitForURL(url => url.pathname === expected);
        await page.getByRole('heading', { name: row.kind + '：' + row.draftTitle }).waitFor();
        assert.equal(await page.locator('.studio-editor form input[maxlength="150"]').first().inputValue(),
          row.draftTitle, 'Studio must select the requested ID, not the public title');
      }
      await author.close();
    } finally {
      await browser.close();
    }
  });
