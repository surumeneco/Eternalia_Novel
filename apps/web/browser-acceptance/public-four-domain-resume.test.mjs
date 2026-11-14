/** PB-03/05/10: four per-series public domains must revalidate on resume.
 * Real disposable Nest/Nuxt/PostgreSQL and anonymous Chromium, with synthetic
 * visibility events (not physical-device or actual BFCache lifecycle testing).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;
const future=Date.parse('2099-12-10T07:00:00.000Z');
async function author(method,path,data) {
  const response=await fetch(base+path,{method,headers:{
    Origin:base,'Content-Type':'application/json',
    Cookie:'eternalia_author='+fixture.authorToken},
    ...(data===undefined?{}:{body:JSON.stringify(data)})});
  const body=await response.text();
  assert.ok(response.ok,method+' '+path+' -> '+response.status+' '+body);
  return JSON.parse(body);
}
async function create(kind,parentId,title,details={}) {
  return (await author('POST','/api/admin/nodes',{kind,parentId,
    content:{title,body:'PUBLIC:'+title,details}})).id;
}
async function revision(id) {
  const node=(await author('GET','/api/admin/nodes')).find(n=>n.id===id);
  assert.ok(node,'missing node '+id);return node.revision;
}
async function publish(id){
  await author('POST','/api/admin/nodes/'+id+'/publish',
    {expectedRevision:await revision(id)});
}
async function visibility(id,publicSince,isPublic=true){
  await author('POST','/api/admin/nodes/'+id+'/visibility',
    {expectedRevision:await revision(id),publicSince,isPublic});
}
async function lifecycle(page,state){
  await page.evaluate(value=>{
    Object.defineProperty(document,'visibilityState',{configurable:true,value});
    document.dispatchEvent(new Event('visibilitychange'));
  },state);
}
async function hydrated(page){
  await page.waitForFunction(()=>Boolean(document.querySelector('#__nuxt')?.__vue_app__));
}

test('FOUR-DOMAIN-RESUME-01/02/03: all four per-series readers revoke cached children and restore after publication',
  {timeout:180_000},async()=>{
    assert.ok(base?.startsWith('http://127.0.0.1:'),'disposable loopback only');
    const browser=await chromium.launch({headless:true});
    let seriesId;
    try{
      const marker=fixture.prefix+'-domain-resume-';
      const seriesTitle=marker+'world';
      seriesId=await create('series',null,seriesTitle);
      const volume=await create('volume',seriesId,marker+'volume');
      const category=await create('category',seriesId,marker+'category');
      const tip=await create('tip',category,marker+'tip');
      const language=await create('language',seriesId,marker+'language');
      const word=await create('word',language,marker+'word');
      const period=await create('periodization',seriesId,marker+'period',{relativeYears:'0'});
      const event=await create('event',period,marker+'event',{year:'2'});
      for(const id of [seriesId,volume,category,tip,language,word,period,event])await publish(id);

      const context=await browser.newContext({viewport:{width:390,height:844}});
      try{
        for(const [area,expectedTitle] of [
          ['stories',marker+'volume'],
          ['tips',marker+'tip'],
          ['dictionaries',marker+'word'],
          ['timeline',marker+'event'],
        ]){
          const page=await context.newPage();
          try{
            const url=base+'/'+area+'/'+seriesId;
            assert.equal((await page.goto(url))?.status(),200,area);
            await hydrated(page);
            await page.getByRole('link',{name:expectedTitle,exact:true}).waitFor();
            assert.ok((await page.locator('main').innerText()).includes(expectedTitle),area+' published initial content absent');
            await lifecycle(page,'hidden');
            assert.ok(!(await page.locator('main').innerText()).includes(expectedTitle),
              area+' retained hidden-tab published item before revalidation');
            await visibility(seriesId,future);
            const publicTree=await context.request.get(base+'/api/public/series/'+seriesId+'/tree');
            assert.equal(publicTree.status(),404,'author series scheduling must revoke server projection');
            const revoked=page.waitForResponse(r=>r.url().endsWith('/api/public/series/'+seriesId+'/tree')&&r.status()===404);
            await lifecycle(page,'visible');
            await revoked;
            await page.locator('main [role="alert"]').waitFor();
            assert.ok(!(await page.locator('main').innerText()).includes(expectedTitle),
              area+' still exposed scheduled child');
            assert.ok(!(await page.locator('.topic-path').innerText()).includes(seriesTitle),
              area+' still exposed series title in cached breadcrumbs');

            await lifecycle(page,'hidden');
            await visibility(seriesId,null);
            const restored=page.waitForResponse(r=>r.url().endsWith('/api/public/series/'+seriesId+'/tree')&&r.status()===200);
            await lifecycle(page,'visible');
            await restored;
            await page.getByRole('link',{name:expectedTitle,exact:true}).waitFor();
            assert.equal(await page.getByRole('link',{name:expectedTitle,exact:true}).count(),1);
          }finally{await page.close()}
        }
      }finally{await context.close()}
    }finally{
      if(seriesId){try{await visibility(seriesId,null,false)}catch{}}
      await browser.close();
    }
  });

test('FOUR-DOMAIN-RESUME-04: a per-series dictionary fails closed when BFCache-style refresh receives 503',
  {timeout:90_000},async()=>{
    const browser=await chromium.launch({headless:true});
    let seriesId;
    try{
      const marker=fixture.prefix+'-domain-resume-bfcache-';
      seriesId=await create('series',null,marker+'series');
      const language=await create('language',seriesId,marker+'language');
      const word=await create('word',language,marker+'SECRET-word');
      for(const id of [seriesId,language,word])await publish(id);
      const context=await browser.newContext();
      try{
        const page=await context.newPage();
        await page.goto(base+'/dictionaries/'+seriesId);
        await hydrated(page);
        await page.getByRole('link',{name:marker+'SECRET-word',exact:true}).waitFor();
        await visibility(seriesId,future);
        await page.route('**/api/public/series/'+seriesId+'/tree',route=>
          route.fulfill({status:503,contentType:'application/json',body:'{"message":"unavailable"}'}));
        const failed=page.waitForResponse(r=>r.url().endsWith('/api/public/series/'+seriesId+'/tree')&&r.status()===503);
        await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
        await failed;
        await page.locator('main [role="alert"]').waitFor();
        assert.ok(!(await page.locator('main').innerText()).includes(marker+'SECRET-word'));
        assert.ok(!(await page.locator('.topic-path').innerText()).includes(marker+'series'));
      }finally{await context.close()}
    }finally{
      if(seriesId){try{await visibility(seriesId,null,false)}catch{}}
      await browser.close();
    }
  });
