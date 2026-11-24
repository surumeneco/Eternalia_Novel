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

test('AC-85/86: mobile overlays contain keyboard focus, block background and restore the opener', {timeout:90000},async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [320,390]){
      const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
      const page=await context.newPage();
      await page.goto(base+'/series/'+fixture.seriesA);
      await ready(page);
      const main=page.locator('#main-content');
      const footer=page.locator('.site-footer');
      for(const [toggleSelector,panelSelector] of [['.nav-toggle','#global-navigation'],['.aside-toggle','#updates-aside']]){
        const toggle=page.locator(toggleSelector);
        await toggle.focus();
        await toggle.press('Enter');
        await page.waitForFunction(sel=>document.querySelector(sel)?.getAttribute('aria-expanded')==='true',toggleSelector);
        const panel=page.locator(panelSelector);
        await panel.waitFor();
        await page.waitForFunction(sel=>document.querySelector(sel)?.contains(document.activeElement),panelSelector);
        assert.equal(await main.evaluate(el=>el.inert),true,'background content must be inert');
        assert.equal(await footer.evaluate(el=>el.inert),true,'footer must be inert');
        await page.locator('.page-top-panel a').evaluate(el=>el.focus());
        assert.equal(await main.evaluate(el=>el.contains(document.activeElement)),false);
        const links=await panel.locator('a[href],button:not([disabled])').count();
        for(let i=0;i<links+3;i++){
          await page.keyboard.press('Tab');
          assert.ok(await page.evaluate(([panel,opener])=>document.querySelector(panel)?.contains(document.activeElement)||document.querySelector(opener)===document.activeElement,[panelSelector,toggleSelector]));
        }
        await page.keyboard.press('Shift+Tab');
        assert.ok(await page.evaluate(([panel,opener])=>document.querySelector(panel)?.contains(document.activeElement)||document.querySelector(opener)===document.activeElement,[panelSelector,toggleSelector]));
        await page.keyboard.press('Escape');
        await page.waitForFunction(sel=>document.activeElement===document.querySelector(sel),toggleSelector);
        assert.equal(await toggle.getAttribute('aria-expanded'),'false');
        assert.equal(await main.evaluate(el=>el.inert),false);
        assert.equal(await footer.evaluate(el=>el.inert),false);
        await toggle.tap();
        await page.locator('.mobile-menu-backdrop').waitFor();
        await page.touchscreen.tap(toggleSelector==='.nav-toggle'?4:width-4,800);
        await page.waitForFunction(sel=>document.querySelector(sel)?.getAttribute('aria-expanded')==='false',toggleSelector);
        assert.equal(await main.evaluate(el=>el.inert),false);
      }
      await context.close();
    }
  }finally{await browser.close()}
});

test('AC-89/96: canonical text and controls respect inherited browser fonts and reflow at 320/640 CSS pixels', {timeout:150000},async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    // 640 CSS px is the reflow viewport of a 1280px desktop at 200%;
    // this is a viewport proxy, not an OS/browser zoom or screen reader test.
    const paths=['/series/'+fixture.seriesA+'/stories/'+fixture.volume+'/parts/'+fixture.part+'/chapters/'+fixture.chapter,
      root+'/stories/chapters',root+'/stories/chapters/'+fixture.chapter+'/edit',root+'/publication'];
    for(const width of [320,640]){
      const ctx=await authorContext(browser,{viewport:{width,height:900},deviceScaleFactor:width===640?2:1});
      const page=await ctx.newPage();
      for(const path of paths){
        await page.goto(base+path);
        await ready(page);
        const expected=path.endsWith('/edit')?'.studio-editor .publication-editor':path.endsWith('/publication')?'.publication-row':path.endsWith('/chapters')?'.admin-node-grid':'main article';
        await page.locator(expected).first().waitFor();
        const before=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
        assert.ok(before.scroll<=before.viewport+1,JSON.stringify({path,width,before}));
        // A browser/user preference expressed at the root must flow through
        // normal text and input/control surfaces, excluding icon pseudoelements.
        const samples=await page.evaluate(()=>{
          document.documentElement.style.fontFamily='monospace';
          const selectors=['main h1','main h2','main p','main a','main button','main input:not([type="checkbox"]):not([type="radio"])','main textarea','main select'];
          const found=[];
          for(const selector of selectors){
            const nodes=Array.from(document.querySelectorAll(selector)).filter(el=>el.getClientRects().length>0);
            for(const el of nodes.slice(0,4))found.push({selector,font:getComputedStyle(el).fontFamily});
          }
          document.documentElement.style.removeProperty('font-family');
          return found;
        });
        assert.ok(samples.length>=3,path);
        for(const sample of samples)assert.equal(sample.font,'monospace',JSON.stringify({path,width,sample}));
        await page.getByRole('button',{name:'表示言語を選択'}).click();
        await page.locator('#language-list').getByRole('button',{name:'English'}).click();
        await page.locator('html[lang="en"]').waitFor();
        const english=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
        assert.ok(english.scroll<=english.viewport+1,JSON.stringify({path,width,english}));
        await page.getByRole('button',{name:'Choose interface language'}).click();
        await page.locator('#language-list').getByRole('button',{name:'日本語'}).click();
        await page.locator('html[lang="ja"]').waitFor();
      }
      await ctx.close();
    }
  }finally{await browser.close()}
});
