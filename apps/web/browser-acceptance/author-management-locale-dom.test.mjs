import { selectUiLanguage } from './ui-language.mjs';
/** CM-08/UI6: live ja/en kind labels and author-only management DOM. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
const privateTip = fixture.prefix + '-visible-setting';

test('AUTHOR-L10N-01/02: author management type labels follow live locale without resetting selections',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable fixture only');
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addCookies([{
        name: 'eternalia_author', value: fixture.authorToken,
        url: base, httpOnly: true, sameSite: 'Lax',
      }]);
      const page = await context.newPage();

      await page.goto(base + '/studio/publication?series=' + fixture.seriesA);
      await page.getByLabel('領域').selectOption('tips');
      const row = page.locator('.publication-row').filter({
        has: page.getByRole('heading', { name: privateTip, exact: true }),
      });
      await row.locator('input[type="datetime-local"]').waitFor();
      const kindLabel = row.locator('.publication-summary > span.note');
      assert.match(await kindLabel.innerText(), /^設定 · /, 'Japanese Tip label before switching');
      await selectUiLanguage(page, 'en');
      await page.getByRole('heading', { name: 'Publication management' }).waitFor();
      assert.match(await kindLabel.innerText(), /^Setting · /,
        'published content type must react to ja→en without navigation');
      assert.equal(await row.locator('h2').innerText(), privateTip,
        'author-authored Tip title must not be translated');
      await selectUiLanguage(page, 'ja');
      await page.getByRole('heading', { name: '公開管理' }).waitFor();
      assert.match(await kindLabel.innerText(), /^設定 · /,
        'published content type must react to en→ja');

      await page.goto(base + '/studio/order?series=' + fixture.seriesA);
      // Reuse stable structural positions across locale switches: getByRole
      // with a Japanese accessible name no longer resolves in English.
      const parent = page.locator('.order-filters select').nth(1);
      const kind = page.locator('.order-filters select').nth(2);
      await parent.locator('option[value="' + fixture.seriesA + '"]').waitFor({ state: 'attached' });
      await parent.selectOption(fixture.seriesA);
      assert.equal(await parent.inputValue(), fixture.seriesA,
        'selecting a series parent must retain the selection');
      await page.waitForFunction(() =>
        document.querySelectorAll('.order-filters select')[2]?.value === 'volume',
      );
      assert.match(await parent.locator('option[value="' + fixture.seriesA + '"]').innerText(), /（シリーズ）$/,
        'Japanese parent kind before switching');
      assert.equal(await kind.locator('option[value="volume"]').innerText(), '編');

      await selectUiLanguage(page, 'en');
      await page.getByRole('heading', { name: 'Reorder' }).waitFor();
      const orderEnglishState = await page.evaluate(() => {
        const selects = [...document.querySelectorAll('.order-filters select')];
        return {
          url: location.href,
          selectCount: selects.length,
          seriesValue: selects[0]?.value,
          parentValue: selects[1]?.value,
          parentOptions: [...(selects[1]?.options ?? [])].map(option => ({
            value: option.value, text: option.textContent,
          })),
          kindValue: selects[2]?.value,
        };
      });
      assert.equal(orderEnglishState.seriesValue, fixture.seriesA,
        'locale switch must preserve selected series: ' + JSON.stringify(orderEnglishState));
      assert.equal(orderEnglishState.parentValue, fixture.seriesA,
        'locale switch must preserve selected parent: ' + JSON.stringify(orderEnglishState));
      assert.match(orderEnglishState.parentOptions.find(item => item.value === fixture.seriesA)?.text ?? '',
        /（Series）$/, 'parent kind must localize: ' + JSON.stringify(orderEnglishState));
      assert.equal(await kind.locator('option[value="volume"]').innerText(), 'Arc',
        'child kind option must react to ja→en');
      assert.equal(await parent.inputValue(), fixture.seriesA,
        'locale change must preserve parent selection');
      assert.equal(await kind.inputValue(), 'volume',
        'locale change must preserve child kind selection');
      await selectUiLanguage(page, 'ja');
      await page.getByRole('heading', { name: '並べ替え' }).waitFor();
      assert.match(await parent.locator('option[value="' + fixture.seriesA + '"]').innerText(), /（シリーズ）$/);
      assert.equal(await kind.locator('option[value="volume"]').innerText(), '編');
      await context.close();
    } finally { await browser.close(); }
  });

test('AUTHOR-DOM-01: anonymous visits to author management routes render auth boundaries but not internal content',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      for (const path of ['/studio/publication', '/studio/order']) {
        const response = await page.goto(base + path);
        assert.equal(response?.status(), 200, path + ' public login shell');
        await page.locator('main.site-main [role="alert"]').waitFor();
        assert.equal(await page.locator('main.site-main nav.topic-path[aria-label]').count(), 1);
        assert.equal(await page.locator('main.site-main section.stone-panel').count(), 1);
        assert.equal(await page.locator('.publication-filters, .order-filters').count(), 0);
        assert.equal(await page.locator('.publication-row, .order-list > li').count(), 0);
        assert.ok(!(await page.locator('main').innerText()).includes(privateTip),
          path + ' must not disclose author node titles');
      }
      const response = await context.request.get(base + '/api/admin/nodes');
      assert.equal(response.status(), 401, 'anonymous author API must remain protected');
      await context.close();
    } finally { await browser.close(); }
  });

test('AUTHOR-DOM-02: publication and ordering screens compose shell/panel and fit 320–1280px',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addCookies([{
        name: 'eternalia_author', value: fixture.authorToken,
        url: base, httpOnly: true, sameSite: 'Lax',
      }]);
      const page = await context.newPage();
      for (const path of ['/studio/publication', '/studio/order']) {
        const response = await page.goto(base + path);
        assert.equal(response?.status(), 200);
        if (path.endsWith('publication')) {
          await page.getByLabel('シリーズを選択').selectOption(fixture.seriesA);
        }
        const data = path.endsWith('publication') ? '.publication-row' : '.order-filters select';
        await page.locator(data).first().waitFor();
        const dom = await page.evaluate(() => {
          const main = document.querySelector('main.site-main');
          const nav = main?.querySelector('nav.topic-path');
          const panel = main?.querySelector('section.stone-panel');
          return {
            landmarks: Boolean(document.querySelector('header.site-header') &&
              document.querySelector('aside.site-aside') && document.querySelector('footer.site-footer') && main),
            labelledNav: Boolean(nav?.getAttribute('aria-label')),
            navBeforePanel: nav?.parentElement === panel?.parentElement && nav?.nextElementSibling === panel,
            panelCount: main?.querySelectorAll('section.stone-panel').length,
            headings: main?.querySelectorAll('section.stone-panel h1').length,
          };
        });
        assert.equal(dom.landmarks, true, path + ' shell landmarks');
        assert.equal(dom.labelledNav, true, path + ' semantic path');
        assert.equal(dom.navBeforePanel, true, path + ' breadcrumb before content panel');
        assert.equal(dom.panelCount, 1, path + ' one panel');
        assert.equal(dom.headings, 1, path + ' one page heading');
        for (const width of [320, 390, 768, 1280]) {
          await page.setViewportSize({ width, height: 844 });
          const size = await page.evaluate(() => ({
            client: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
          }));
          assert.ok(size.scroll <= size.client + 2,
            path + ' at ' + width + 'px horizontal overflow ' + JSON.stringify(size));
        }
      }
      await context.close();
    } finally { await browser.close(); }
  });
