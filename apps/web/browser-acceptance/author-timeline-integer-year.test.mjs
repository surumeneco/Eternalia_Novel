/** TL-03: browser checks preserved integer fields, never invents cross-period conversion. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;
test('TL-03: author edits integer RelativeYears and negative Event.Year without auto publication',
 {timeout:90_000},async()=>{
 assert.ok(base?.startsWith('http://127.0.0.1:'));
 const browser=await chromium.launch({headless:true});
 try {
  const author=await browser.newContext();
  await author.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
  const prefix=fixture.prefix+'-timeline-int';
  async function create(kind,parentId,title,details={}){
   const r=await author.request.post(base+'/api/admin/nodes',{headers:{Origin:base},
     data:{kind,parentId,content:{title,body:'',details}}});
   assert.equal(r.status(),201,await r.text());
   return(await r.json()).id;
  }
  const list=async()=>(await(await author.request.get(base+'/api/admin/nodes')).json());
  const get=id=>(async()=> (await list()).find(n=>n.id===id))();
  async function publish(id){
   const r=await author.request.post(base+'/api/admin/nodes/'+id+'/publish',{headers:{Origin:base},
     data:{expectedRevision:(await get(id)).revision}});
   assert.equal(r.status(),200,await r.text());
  }
  const period=await create('periodization',fixture.seriesA,prefix+'-period',{relativeYears:'0'});
  const event=await create('event',period,prefix+'-event',{year:'0'});
  for(const id of [period,event])await publish(id);
  const page=await author.newPage();
  await page.goto(base+'/studio?item='+period);
  await page.getByRole('heading',{name:'年代区分：'+prefix+'-period'}).waitFor();
  const offset=page.getByRole('textbox',{name:'年代区分の相対年数（整数・年0・負年を使用可）'});
  await offset.fill('-200');
  await page.getByRole('button',{name:'下書きを保存'}).click();
  await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
  assert.equal((await get(period)).draft.details.relativeYears,'-200');
  assert.equal((await get(period)).published.value.details.relativeYears,'0');
  await page.reload();
  assert.equal(await offset.inputValue(),'-200');
  const invalid=await author.request.patch(base+'/api/admin/nodes/'+event,{headers:{Origin:base},
   data:{expectedRevision:(await get(event)).revision,
     content:{title:prefix+'-event',body:'',details:{year:'1.5'}}}});
  assert.equal(invalid.status(),400,'fractional years must be rejected at the API');
  assert.equal((await get(event)).draft.details.year,'0');
  await page.goto(base+'/studio?item='+event);
  await page.getByRole('heading',{name:'出来事：'+prefix+'-event'}).waitFor();
  await page.getByRole('textbox',{name:'相対年'}).fill('-1');
  await page.getByRole('button',{name:'下書きを保存'}).click();
  await page.getByText('下書きを保存しました。公開版は変更されていません。').waitFor();
  assert.equal((await get(event)).draft.details.year,'-1');
  assert.equal((await get(event)).published.value.details.year,'0');
  await publish(event);
  const reader=await author.request.get(base+'/api/public/items/'+event);
  assert.equal(reader.status(),200);
  assert.equal((await reader.json()).content.details.year,'-1');
 }finally{await browser.close()}
});
