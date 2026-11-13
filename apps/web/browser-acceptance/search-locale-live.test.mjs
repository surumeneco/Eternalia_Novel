/** CM-08/AC-59/75: public search locale updates without losing filters or user-authored content. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;
test('SEARCH-01/02/03/04: search domain options and result kinds react instantly across ja/en',
 {timeout:90_000},async()=>{
  assert.ok(base?.startsWith('http://127.0.0.1:'));
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    await page.goto(base+'/search?series='+fixture.seriesA);
    const selects=page.locator('.search-filters select');
    const domain=selects.nth(1);
    const search=page.locator('.search-filters input[type="search"]');
    await domain.waitFor();
    // Prove the seeded reader-side tree is available before inspecting UI state.
    const treeHttp = await context.request.get(base+'/api/public/series/'+fixture.seriesA+'/tree');
    assert.equal(treeHttp.status(),200);
    assert.ok((await treeHttp.json()).some(node=>node.content.title===fixture.prefix+'-book-A'),
      'test fixture volume must be visible to anonymous readers');
    // The header is SSR-rendered, so explicitly await client hydration by
    // making a reactive language change before controlling the search fields.
    await page.getByRole('button',{name:'英語に切り替え'}).click();
    await page.getByRole('button',{name:'Switch to Japanese'}).waitFor();
    await page.getByRole('button',{name:'Switch to Japanese'}).click();
    await page.getByRole('button',{name:'英語に切り替え'}).waitFor();
    // SSR may already display the query-series selection before hydration.
    // Force a client-side series change and wait for the reactive tree fetch
    // before evaluating the search result; do not rely on SSR's initial value.
    const seriesControl = selects.first();
    await seriesControl.selectOption('');
    await seriesControl.selectOption(fixture.seriesA);
    assert.equal(await seriesControl.inputValue(),fixture.seriesA);
    await domain.selectOption('stories');
    await search.fill(fixture.prefix+'-book-A');
    await page.waitForTimeout(1100); // temporary diagnostic to capture live state
    console.log('SEARCH_UI_DIAGNOSTIC',JSON.stringify({
      series:await selects.first().inputValue(),
      domain:await domain.inputValue(),
      search:await search.inputValue(),
      results:await page.locator('.search-result').count(),
      main:(await page.locator('main').innerText()).slice(0,1600),
    }));
    const result=page.locator('.search-result').first();
    await result.locator('a').getByText(fixture.prefix+'-book-A').waitFor();
    const originalTitle=await result.locator('a').innerText();
    const originalHref=await result.locator('a').getAttribute('href');
    const optionsJa=await domain.locator('option').allTextContents();
    assert.deepEqual(optionsJa.map(x=>x.trim()),['すべて','ストーリー','設定集','辞書','年表']);
    assert.match(await result.locator('span.note').innerText(),/編/);
    await page.getByRole('button',{name:'英語に切り替え'}).click();
    await page.getByRole('button',{name:'Switch to Japanese'}).waitFor();
    assert.equal(await domain.locator('option[value="stories"]').textContent(),'Stories');
    assert.deepEqual((await domain.locator('option').allTextContents()).map(x=>x.trim()),
      ['All','Stories','Worldbuilding','Dictionary','Timeline']);
    await result.locator('span.note').getByText('Arc',{exact:false}).waitFor();
    assert.equal(await domain.inputValue(),'stories');
    assert.equal(await search.inputValue(),fixture.prefix+'-book-A');
    assert.equal(await result.locator('a').innerText(),originalTitle);
    assert.equal(await result.locator('a').getAttribute('href'),originalHref);
    assert.ok(!(await page.locator('main').innerText()).includes(fixture.prefix+'-private-tip'),
      'published search must never include private content');
    await page.getByRole('button',{name:'Switch to Japanese'}).click();
    await page.getByRole('button',{name:'英語に切り替え'}).waitFor();
    assert.equal(await domain.locator('option[value="stories"]').textContent(),'ストーリー');
    assert.match(await result.locator('span.note').innerText(),/編/);
    assert.equal(await search.inputValue(),fixture.prefix+'-book-A');
    assert.equal(await result.locator('a').innerText(),originalTitle);
    await context.close();
  }finally{await browser.close()}
});
