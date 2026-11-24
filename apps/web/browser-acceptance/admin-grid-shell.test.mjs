/** W04/W05 / AC-81,83,88,90,93,96: exploratory UI verification.
 * Fresh disposable database, synthetic author, no writes or manual acceptance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
assert.equal(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB,'1');
assert.notEqual(process.env.NODE_ENV,'production');
const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;
assert.match(base??'',/^http:\/\/127\.0\.0\.1:\d+$/);
const root='/admin/series/'+fixture.seriesA;
const groups=[
  ['stories/volumes',fixture.volume],['stories/parts',fixture.part],
  ['stories/chapters',fixture.chapter],['settings/categories',fixture.category],
  ['settings/tips',fixture.tip],['settings/sections',fixture.section],
  ['dictionaries/languages',fixture.language],['dictionaries/words',fixture.word],
  ['dictionaries/grammar',fixture.grammar],['timeline/periods',fixture.period],
  ['timeline/events',fixture.event],
];
async function authorContext(browser,options={}){
  const context=await browser.newContext(options);
  await context.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
  return context;
}
async function ready(page){
  await page.waitForFunction(()=>Boolean(document.querySelector('#__nuxt')?.__vue_app__));
}
test('W04: each canonical management grid opens its own existing editor', {timeout:180000}, async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await authorContext(browser);
    const nodes=await (await context.request.get(base+'/api/admin/nodes')).json();
    const byId=new Map(nodes.map(n=>[n.id,n]));
    const page=await context.newPage();
    for(const [group,id] of groups){
      const grid=root+'/'+group, edit=grid+'/'+id+'/edit';
      await page.goto(base+grid); await ready(page);
      const row=page.locator('main .admin-node-grid tr').filter({has:page.locator('a[href="'+edit+'"]')});
      await row.waitFor();
      assert.equal(await row.locator('th[scope="row"]').innerText(),byId.get(id).draft.title,grid);
      assert.equal(await page.locator('main .admin-node-grid a[href*="'+fixture.languageB+'"]').count(),0,grid);
      await row.locator('a[href="'+edit+'"]').click();
      await page.waitForURL(url=>url.pathname===edit);
      // The page route may mount before the asynchronous author data/selection settles.
      const heading=page.locator('.studio-editor h2').filter({hasText:'：'+byId.get(id).draft.title});
      await heading.waitFor({timeout:10000});
      assert.ok((await heading.innerText()).endsWith('：'+byId.get(id).draft.title),edit);
      assert.equal(await page.locator('.studio-editor .create-form').count(),0,edit);
      await page.locator('.studio-editor .publication-editor').waitFor();
    }
    const chapter=root+'/stories/chapters/'+fixture.chapter;
    await page.goto(base+chapter+'/preview');
    await page.locator('main').getByRole('heading',{name:byId.get(fixture.chapter).draft.title,exact:true}).waitFor();
    await page.locator('main a[href="'+chapter+'/edit"]').click();
    await page.waitForURL(url=>url.pathname===chapter+'/edit');
    await context.close();
  }finally{await browser.close()}
});

test('W04: canonical foreign edit and anonymous/outsider access never expose author forms', {timeout:90000},async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const author=await authorContext(browser);
    const authorPage=await author.newPage();
    await authorPage.goto(base+root+'/dictionaries/languages/'+fixture.languageB+'/edit');
    await authorPage.locator('.admin-editor-page h1').waitFor();
    assert.equal(await authorPage.locator('.studio-editor').count(),0);
    await author.close();
    for(const token of [null,fixture.outsiderToken]){
      const ctx=await browser.newContext();
      if(token)await ctx.addCookies([{name:'eternalia_author',value:token,url:base,httpOnly:true,sameSite:'Lax'}]);
      const page=await ctx.newPage();
      for(const path of [root+'/stories/chapters',root+'/stories/chapters/'+fixture.chapter+'/edit',root+'/publication']){
        await page.goto(base+path); await ready(page);
        assert.equal(await page.locator('main .studio-editor,main .admin-node-grid,main .publication-row').count(),0,path);
        assert.equal(await page.locator('#global-navigation a[href="/admin"]').count(),0,path);
      }
      await ctx.close();
    }
  }finally{await browser.close()}
});

test('W05: 320px and desktop shell labels, locale and Escape behavior', {timeout:90000},async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [320,1280]){
      const context=await browser.newContext({viewport:{width,height:844}});
      const page=await context.newPage();
      await page.goto(base+'/series/'+fixture.seriesA); await ready(page);
      await page.locator('button.locale-switch:not(:disabled)').waitFor();
      const labels=['表示言語を選択'];
      if(width===320)labels.push('新着・更新メニュー','メインメニュー');
      for(const label of labels){
        const button=page.getByRole('button',{name:label,exact:true});
        await button.waitFor();
        assert.equal(await button.locator('i.bi[aria-hidden="true"]').count(),1);
      }
      const locale=page.getByRole('button',{name:'表示言語を選択'});
      const header=page.locator('.site-header');
      const height=(await header.boundingBox()).height;
      if(width===320){
        for(const label of ['メインメニュー','新着・更新メニュー']){
          const toggle=page.getByRole('button',{name:label});
          await toggle.click();
          assert.equal(await toggle.getAttribute('aria-expanded'),'true');
          await page.keyboard.press('Escape');
          assert.equal(await toggle.getAttribute('aria-expanded'),'false');
          assert.ok(Math.abs((await header.boundingBox()).height-height)<=1);
        }
      }
      await locale.click();
      await page.locator('#language-list').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await locale.getAttribute('aria-expanded'),'false');
      await locale.click();
      await page.locator('#language-list').getByRole('button',{name:'English'}).click();
      await page.locator('html[lang="en"]').waitFor();
      assert.ok((await page.locator('main').innerText()).includes(fixture.prefix+'-world-A'));
      await context.close();
    }
  }finally{await browser.close()}
});
