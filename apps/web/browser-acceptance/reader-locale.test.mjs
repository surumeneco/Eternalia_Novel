import { selectUiLanguage } from './ui-language.mjs';
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
   assert.equal(await page.locator('main .series-areas a[href="/series/'+fixture.seriesA+'/stories"]').innerText(),'ストーリー');
   await selectUiLanguage(page, 'en');
   await page.getByRole('link',{name:'Stories'}).waitFor();
   assert.equal(await page.locator('main .series-areas a[href="/series/'+fixture.seriesA+'/stories"]').innerText(),'Stories');
   await page.goto(base+'/series/'+fixture.seriesA+'/stories');
   await page.getByRole('heading',{name:'Stories'}).waitFor();
   await page.locator('.domain-list a').first().waitFor();
   assert.ok((await page.locator('main').innerText()).includes(title),'author title must remain identical');

   await page.goto(base+'/series/'+fixture.seriesA+'/dictionaries/'+fixture.language);
   await page.getByRole('heading',{name:title+' — Dictionary'}).waitFor();
   assert.ok((await page.locator('.domain-filters label').first().innerText()).includes('Search words'));
   
   await page.getByLabel('Search words').fill(fixture.prefix+'-visible-word');
   assert.equal(await page.locator('.domain-list li').first().locator('a').innerText(),fixture.prefix+'-visible-word');

   await page.goto(base+'/series/'+fixture.seriesA+'/settings/'+fixture.category);
   await page.getByRole('link',{name:fixture.prefix+'-visible-setting',exact:true}).waitFor();
   
   assert.ok((await page.locator('main').innerText()).includes(fixture.prefix+'-visible-setting'));

   await page.goto(base+'/series/'+fixture.seriesA+'/timeline');
   await page.getByRole('heading',{name:title+' — Timeline'}).waitFor();
   assert.ok((await page.locator('.period-filter').innerText()).includes('Period'));
   await page.locator('.period-filter select').selectOption(fixture.period);
   assert.ok((await page.locator('main').innerText()).includes('Relative year 12'));

   await page.goto(base+'/series/'+fixture.seriesA+'/stories/'+fixture.volume+'/parts/'+fixture.part+'/chapters/'+fixture.chapter);
   const chapterTitle=fixture.prefix+'-chapter-A';
   await page.getByRole('heading',{name:chapterTitle}).waitFor();
   assert.ok((await page.locator('main').innerText()).includes(fixture.prefix+'-published-body'));
   await page.getByRole('button',{name:'Next page'}).waitFor();
   await page.getByRole('link',{name:'Back to contents'}).waitFor();

   await selectUiLanguage(page, 'ja');
   await page.getByRole('link',{name:'目次へ戻る'}).waitFor();
   await page.getByRole('button',{name:'次のページ'}).waitFor();
   assert.ok((await page.locator('main').innerText()).includes(chapterTitle));
   await page.goto(base+'/series/'+fixture.seriesA+'/dictionaries/'+fixture.language);
   assert.ok((await page.locator('.domain-filters label').first().innerText()).includes('単語を検索'));
   
   await ctx.close();
  } finally { await browser.close(); }
});
