/** CM-08/AC-59: reader-facing ja/en labels in the real Nuxt+Nest+PostgreSQL app. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;

test('READER-01/02/03: public series and reader areas localize immediately without changing authored data',
 {timeout:90_000},async()=>{
  assert.ok(base?.startsWith('http://127.0.0.1:'));
  const browser=await chromium.launch({headless:true});
  try {
   const ctx=await browser.newContext({viewport:{width:390,height:844}});
   const page=await ctx.newPage();
   await page.goto(base+'/series/'+fixture.seriesA);
   const title=fixture.prefix+'-world-A';
   await page.getByRole('heading',{name:title}).waitFor();
   assert.equal(await page.locator('main .series-areas a[href="/stories/'+fixture.seriesA+'"]').innerText(),'ストーリーの目次');
   await page.getByRole('button',{name:'英語に切り替え'}).click();
   await page.getByRole('link',{name:'Story table of contents'}).waitFor();
   assert.equal(await page.locator('main .series-areas a[href="/stories/'+fixture.seriesA+'"]').innerText(),'Story table of contents');
   assert.equal(await page.locator('.reader-list small').first().innerText(),'Arc');
   assert.ok((await page.locator('main').innerText()).includes(title),'author title must remain identical');

   await page.goto(base+'/dictionaries/'+fixture.seriesA);
   await page.getByRole('heading',{name:title+' — Dictionary'}).waitFor();
   await page.getByLabel('Language',{exact:true}).selectOption(fixture.language);
   await page.getByLabel('Search words').fill(fixture.prefix+'-visible-word');
   assert.equal(await page.locator('.dictionary-language .reader-list li').first().locator('a').innerText(),fixture.prefix+'-visible-word');

   await page.goto(base+'/tips/'+fixture.seriesA);
   await page.getByRole('heading',{name:title+' — Worldbuilding'}).waitFor();
   await page.getByLabel('Search settings').fill(fixture.prefix+'-visible-setting');
   assert.ok((await page.locator('main').innerText()).includes(fixture.prefix+'-visible-setting'));

   await page.goto(base+'/timeline/'+fixture.seriesA);
   await page.getByRole('heading',{name:title+' — Timeline'}).waitFor();
   await page.getByLabel('Period',{exact:true}).selectOption(fixture.period);
   assert.ok((await page.locator('main').innerText()).includes('Relative year 12'));

   await page.goto(base+'/read/'+fixture.chapter);
   const chapterTitle=fixture.prefix+'-chapter-A';
   await page.getByRole('heading',{name:chapterTitle}).waitFor();
   assert.ok((await page.locator('main').innerText()).includes(fixture.prefix+'-published-body'));
   await page.getByRole('link',{name:'Back to contents'}).waitFor();

   await page.getByRole('button',{name:'Switch to Japanese'}).click();
   await page.getByRole('link',{name:'目次へ戻る'}).waitFor();
   assert.ok((await page.locator('main').innerText()).includes(chapterTitle));
   await page.goto(base+'/dictionaries/'+fixture.seriesA);
   await page.getByLabel('言語',{exact:true}).selectOption(fixture.language);
   await ctx.close();
  } finally { await browser.close(); }
});
