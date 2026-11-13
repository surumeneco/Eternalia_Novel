/** Chapter-only WR-07 autosave/recovery against built Nuxt + Nest + disposable PostgreSQL.
 * This uses a seeded synthetic author session, not an external Discord OAuth login.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;

async function chapterFrom(request) {
  const response = await request.get(base + '/api/admin/nodes');
  assert.equal(response.status(), 200);
  const nodes = await response.json();
  const chapter = nodes.find(node => node.id === fixture.chapter);
  assert.equal(chapter?.kind, 'chapter');
  return chapter;
}

test('AC-11 chapter autosave, offline recovery, conflict and unpublished snapshot', { timeout: 90_000 }, async () => {
  assert.ok(base?.startsWith('http://127.0.0.1:'));
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.addCookies([{ name:'eternalia_author', value:fixture.authorToken, url:base,
      httpOnly:true, sameSite:'Lax' }]);
    const page = await context.newPage();
    const reader = await browser.newContext();
    const publicBefore = await reader.request.get(base + '/api/public/items/' + fixture.chapter);
    assert.equal(publicBefore.status(), 200);
    const originalPublished = (await publicBefore.json()).content;
    await page.goto(base + '/studio?item=' + fixture.chapter);
    const editor = page.locator('.studio-editor textarea').first();
    await editor.waitFor();
    const first = '自動保存A-' + fixture.prefix;
    await editor.fill(first);
    await page.getByText('章の下書きを自動保存しました（公開版は変更されません）。').waitFor({ timeout:15_000 });
    const saved = await chapterFrom(context.request);
    assert.equal(saved.draft.pages[0], first);
    assert.deepEqual((await (await reader.request.get(base + '/api/public/items/' + fixture.chapter)).json()).content, originalPublished);

    // A dropped PATCH keeps every character in the tab's private recovery cache.
    await page.route('**/api/admin/nodes/' + fixture.chapter, route => route.abort('failed'));
    const offline = '通信断で残す文字🍀-' + fixture.prefix;
    await editor.fill(offline);
    await page.getByText('自動保存できませんでした。入力は保持されています。再試行してください。').first().waitFor({ timeout:15_000 });
    assert.equal(await editor.inputValue(), offline);
    const cacheBefore = await page.evaluate(id => sessionStorage.getItem('eternalia:chapter-recovery:' + id), fixture.chapter);
    assert.ok(cacheBefore?.includes(offline), 'offline local recovery must contain the full unsaved input');
    await page.unroute('**/api/admin/nodes/' + fixture.chapter);
    page.once('dialog', dialog => dialog.accept());
    await page.reload();
    await page.getByRole('button', { name: '未保存原稿を復元' }).waitFor({timeout:15_000});
    await page.getByRole('button', { name: '未保存原稿を復元' }).click();
    assert.equal(await editor.inputValue(), offline);
    await page.getByText('章の下書きを自動保存しました（公開版は変更されません）。').waitFor({timeout:15_000});
    assert.equal((await chapterFrom(context.request)).draft.pages[0], offline);

    // A separate editor updates the revision first. Our stale PATCH must 409,
    // retain the form, stop autosaving, and never overwrite the other writer.
    const beforeConflict = await chapterFrom(context.request);
    const otherContent = { ...beforeConflict.draft, pages:['別タブの章'], body:'別タブの章' };
    const remote = await context.request.patch(base + '/api/admin/nodes/' + fixture.chapter, {
      data: { expectedRevision: beforeConflict.revision, content: otherContent },
      headers: { Origin: base },
    });
    assert.equal(remote.status(), 200);
    const local = '競合時に失わない原稿-' + fixture.prefix;
    await editor.fill(local);
    await page.getByText('他の編集元との改訂競合を検知しました。', { exact: false }).first().waitFor({timeout:15_000});
    assert.equal(await editor.inputValue(), local);
    assert.equal((await chapterFrom(context.request)).draft.pages[0], '別タブの章');
    const conflictCache = await page.evaluate(id => sessionStorage.getItem('eternalia:chapter-recovery:' + id), fixture.chapter);
    assert.ok(conflictCache?.includes(local));
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name:'下書きを保存' }).click();
    await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor({timeout:15_000});
    assert.equal((await chapterFrom(context.request)).draft.pages[0], local);
    assert.deepEqual((await (await reader.request.get(base + '/api/public/items/' + fixture.chapter)).json()).content, originalPublished);
  } finally { await browser.close(); }
});
