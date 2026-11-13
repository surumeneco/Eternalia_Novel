/** CM-08 / AC-59: real Nuxt/Chromium anonymous ja/en interface behavior. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;

test('CM-08: header switches ja/en and preserves published author text on reload',
  {timeout:90_000}, async()=>{
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser=await chromium.launch({headless:true});
    try{
      const context=await browser.newContext({viewport:{width:390,height:844}});
      const reader=await context.request.get(base+'/api/public/items/'+fixture.seriesA);
      assert.equal(reader.status(),200);
      const authoredTitle=(await reader.json()).content.title;
      const page=await context.newPage();
      await page.goto(base+'/series/'+fixture.seriesA);
      await page.getByRole('button',{name:'表示言語'}).waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'),'ja');
      assert.ok((await page.locator('main').innerText()).includes(authoredTitle));
      await page.getByRole('button',{name:'表示言語'}).click();
      await page.getByRole('button',{name:'Display language'}).waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
      assert.equal(await page.locator('#global-navigation a[href="/stories"]').innerText(),'Stories');
      assert.ok((await page.locator('main').innerText()).includes(authoredTitle),
        'English interface must not translate author-created content');
      await page.reload();
      await page.getByRole('button',{name:'Display language'}).waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
      assert.equal(await page.locator('#global-navigation a[href="/stories"]').innerText(),'Stories');
      assert.ok((await page.locator('main').innerText()).includes(authoredTitle));
      await page.getByRole('button',{name:'Display language'}).click();
      await page.getByRole('button',{name:'表示言語'}).waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'),'ja');
      assert.equal(await page.locator('#global-navigation a[href="/stories"]').innerText(),'ストーリー');
      assert.ok((await page.locator('main').innerText()).includes(authoredTitle));
      await context.close();
    }finally{await browser.close();}
  });
