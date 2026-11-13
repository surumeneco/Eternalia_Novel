/** PB-05 / CM-08 / AC-54,59: public detail dates use JST in every client timezone. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

function expectedDate(timestamp, language) {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(timestamp));
}

test('READER-JST-01/02/03: reader detail and chapters keep JST instant across client timezones and ja/en',
  { timeout: 120_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser = await chromium.launch({ headless: true });
    try {
      for (const timezoneId of ['America/Los_Angeles', 'UTC']) {
        const context = await browser.newContext({ timezoneId, viewport: { width: 390, height: 844 } });
        try {
          for (const [path, id] of [
            ['/read/', fixture.chapter],
            ['/items/', fixture.tip],
          ]) {
            const response = await context.request.get(base + '/api/public/items/' + id);
            assert.equal(response.status(), 200);
            const published = await response.json();
            const instant = published.publishedAt;
            const title = published.content.title;
            const page = await context.newPage();
            try {
              await page.goto(base + path + id);
              await page.getByRole('heading', { name: title, exact: true }).waitFor();
              // SSR can display the header before Vue has attached click handlers.
              await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
              const time = page.locator('main time[datetime]').first();
              await time.waitFor();
              const iso = new Date(instant).toISOString();
              assert.equal(await time.getAttribute('datetime'), iso);
              assert.equal(await time.innerText(), expectedDate(instant, 'ja'),
                'Japanese reader display must use JST even in ' + timezoneId);

              await page.locator('button.locale-switch').click();
              await page.locator('html[lang="en"]').waitFor();
              assert.equal(await time.getAttribute('datetime'), iso,
                'locale switch must not shift the publication instant');
              assert.equal(await time.innerText(), expectedDate(instant, 'en'),
                'English reader display must still use JST');
              assert.equal(await page.getByRole('heading', { name: title, exact: true }).count(), 1,
                'author-created title must not be translated');

              await page.locator('button.locale-switch').click();
              await page.locator('html[lang="ja"]').waitFor();
              assert.equal(await time.innerText(), expectedDate(instant, 'ja'));
              assert.equal(await time.getAttribute('datetime'), iso);
            } finally {
              await page.close();
            }
          }
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  });
