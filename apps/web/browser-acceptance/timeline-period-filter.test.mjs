/**
 * Exploratory acceptance for already-implemented periodized timeline behavior.
 * Uses only a disposable CI PostgreSQL fixture and synthetic author session;
 * neither cross-period epoch conversion nor real Discord OAuth is asserted.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

test('AC-68 partial: anonymous period filter, within-period chronology, and hidden descendants',
  { timeout: 90_000 }, async () => {
    assert.ok(base?.startsWith('http://127.0.0.1:'), 'disposable loopback app required');
    const browser = await chromium.launch({ headless: true });
    try {
      const author = await browser.newContext();
      const reader = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        await author.addCookies([{
          name: 'eternalia_author', value: fixture.authorToken, url: base,
          httpOnly: true, sameSite: 'Lax',
        }]);
        const prefix = fixture.prefix + '-period-filter';
        async function create(kind, parentId, title, details = {}) {
          const response = await author.request.post(base + '/api/admin/nodes', {
            headers: { Origin: base },
            data: { kind, parentId, content: { title, body: '', details } },
          });
          assert.equal(response.status(), 201, await response.text());
          return (await response.json()).id;
        }
        async function publish(id) {
          const response = await author.request.post(base + '/api/admin/nodes/' + id + '/publish', {
            headers: { Origin: base }, data: { expectedRevision: 1 },
          });
          assert.equal(response.status(), 200, await response.text());
        }
        const secondPeriodTitle = prefix + '-second-period';
        const earlierTitle = prefix + '-early-event';
        const laterTitle = prefix + '-late-event';
        const secondPeriod = await create('periodization', fixture.seriesA, secondPeriodTitle);
        const later = await create('event', secondPeriod, laterTitle, { year: '18' });
        const earlier = await create('event', secondPeriod, earlierTitle, { year: '-4' });
        for (const id of [secondPeriod, later, earlier]) await publish(id);

        const page = await reader.newPage();
        const response = await page.goto(base + '/timeline/' + fixture.seriesA);
        assert.equal(response?.status(), 200);
        const filter = page.locator('.period-filter select');
        await filter.waitFor();
        assert.ok(await filter.locator('option[value="' + fixture.period + '"]').count(),
          'existing public period must remain selectable');
        assert.equal((await filter.locator('option[value="' + secondPeriod + '"]').textContent())?.trim(),
          secondPeriodTitle);
        await filter.selectOption(secondPeriod);
        assert.equal(await page.locator('.period-group').count(), 1,
          'selected period must be the only displayed group');
        assert.equal(await page.locator('.period-group h2').innerText(), secondPeriodTitle);
        assert.deepEqual(await page.locator('.period-group .event-list li a').allTextContents(),
          [earlierTitle, laterTitle], 'relative years must be sorted only inside the period');
        assert.equal(await page.getByText(fixture.prefix + '-visible-event', { exact: true }).count(), 0,
          'filter must hide unrelated period events');

        await filter.selectOption('');
        assert.ok(await page.locator('.period-group').count() >= 2,
          'selecting all must restore each public period, without any epoch conversion');
        assert.equal(await page.getByText(fixture.prefix + '-visible-event', { exact: true }).count(), 1);

        const hide = await author.request.post(base + '/api/admin/nodes/' + secondPeriod + '/visibility', {
          headers: { Origin: base },
          data: { expectedRevision: 1, isPublic: false, publicSince: null },
        });
        assert.equal(hide.status(), 200, await hide.text());
        await page.reload();
        assert.equal(await page.locator('.period-filter select option[value="' + secondPeriod + '"]').count(), 0,
          'hidden parent must no longer be a filter option');
        assert.equal(await page.getByText(earlierTitle, { exact: true }).count(), 0);
        assert.equal(await page.getByText(laterTitle, { exact: true }).count(), 0);
        assert.equal((await reader.request.get(base + '/api/public/items/' + earlier)).status(), 404,
          'hidden parent must also block direct child API reads');
        assert.equal((await reader.request.get(base + '/api/public/items/' + fixture.event)).status(), 200,
          'hiding one period must not alter an unrelated published period');
      } finally {
        await reader.close();
        await author.close();
      }
    } finally {
      await browser.close();
    }
  });
