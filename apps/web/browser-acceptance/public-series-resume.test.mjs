/** PB-03/10: a mounted series TOC must fail closed after lifecycle restore.
 * Disposable PG + Nuxt/Nest; headless visibility events are synthetic.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
async function author(method,path,data) {
  const response = await fetch(base+path, { method, headers: {
    Origin:base, 'Content-Type':'application/json',
    Cookie:'eternalia_author='+fixture.authorToken },
    ...(data===undefined?{}:{body:JSON.stringify(data)}) });
  const body=await response.text();
  assert.ok(response.ok,method+' '+path+' '+response.status+' '+body);
  return JSON.parse(body);
}
async function create(kind,parentId,title) {
  return (await author('POST','/api/admin/nodes',{kind,parentId,
    content:{title,body:'PUBLIC:'+title,details:{}}})).id;
}
async function revision(id) {
  const node=(await author('GET','/api/admin/nodes')).find(n=>n.id===id);
  assert.ok(node);return node.revision;
}
async function publish(id) {
  await author('POST','/api/admin/nodes/'+id+'/publish',
    {expectedRevision:await revision(id)});
}
async function visibility(id,publicSince,isPublic=true) {
  await author('POST','/api/admin/nodes/'+id+'/visibility',
    {expectedRevision:await revision(id),publicSince,isPublic});
}
async function visible(page,state) {
  await page.evaluate(v=>{
    Object.defineProperty(document,'visibilityState',{configurable:true,value:v});
    document.dispatchEvent(new Event('visibilitychange'));
  },state);
}
test('SERIES-RESUME-01/02/03/04: a selected series settings list is revoked, restored and fail-closed on 503',
  {timeout:120_000},async()=>{
    assert.ok(base?.startsWith('http://127.0.0.1:'));
    const browser=await chromium.launch({headless:true});
    let seriesId;
    try {
      const seriesTitle=fixture.prefix+'-resume-TOC-world';
      const childTitle=fixture.prefix+'-resume-TOC-SECRET-child';
      seriesId=await create('series',null,seriesTitle);
      const category=await create('category',seriesId,fixture.prefix+'-resume-category');
      const tipId=await create('tip',category,childTitle);
      for(const id of [seriesId,category,tipId]) await publish(id);
      const context=await browser.newContext({viewport:{width:390,height:844}});
      try {
        const page=await context.newPage();
        await page.goto(base+'/tips/'+seriesId);
        await page.getByRole('heading',{name:new RegExp(seriesTitle)}).waitFor();
        await page.getByRole('link',{name:new RegExp(childTitle)}).waitFor();
        await page.waitForFunction(()=>Boolean(document.querySelector('#__nuxt')?.__vue_app__));
        await visible(page,'hidden');
        assert.ok(!(await page.locator('main').innerText()).includes(childTitle),
          'hidden tab still displays cached child title');
        await visibility(seriesId,Date.parse('2099-12-10T07:00:00Z'));
        assert.equal((await context.request.get(base+'/api/public/series/'+seriesId+'/tree')).status(),404);
        const revoked=page.waitForResponse(r=>r.url().endsWith('/api/public/series/'+seriesId+'/tree')&&r.status()===404);
        await visible(page,'visible');
        await revoked;
        await page.locator('main [role="alert"]').waitFor();
        assert.ok(!(await page.locator('main').innerText()).includes(seriesTitle));
        assert.ok(!(await page.locator('main').innerText()).includes(childTitle));
        assert.ok(!(await page.locator('.topic-path').innerText()).includes(seriesTitle));
        await visible(page,'hidden');
        await visibility(seriesId,null);
        const restored=page.waitForResponse(r=>r.url().endsWith('/api/public/series/'+seriesId+'/tree')&&r.status()===200);
        await visible(page,'visible');
        await restored;
        await page.getByRole('heading',{name:new RegExp(seriesTitle)}).waitFor();
        await page.getByRole('link',{name:new RegExp(childTitle)}).waitFor();
        await page.route('**/api/public/series/'+seriesId+'/tree',
          route=>route.fulfill({status:503,contentType:'application/json',body:'{"message":"temporarily unavailable"}'}));
        const failed=page.waitForResponse(r=>r.url().endsWith('/api/public/series/'+seriesId+'/tree')&&r.status()===503);
        await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
        await failed;
        await page.locator('main [role="alert"]').waitFor();
        assert.ok(!(await page.locator('main').innerText()).includes(seriesTitle));
        assert.ok(!(await page.locator('main').innerText()).includes(childTitle));
      } finally { await context.close(); }
    } finally {
      if(seriesId){try{await visibility(seriesId,null,false)}catch{}}
      await browser.close();
    }
  });
