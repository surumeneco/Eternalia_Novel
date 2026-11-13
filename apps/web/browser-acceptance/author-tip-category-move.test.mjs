/** AC-46: real Chromium, Nest/Nuxt and disposable PostgreSQL with synthetic author session. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;

test('AC-46: author category move preserves published tree until explicit publication', {timeout:90_000}, async()=>{
 assert.ok(base?.startsWith('http://127.0.0.1:'));
 const browser=await chromium.launch({headless:true});
 try {
  const author=await browser.newContext();
  await author.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
  const anonymous=await browser.newContext();
  const prefix=fixture.prefix+'-move-tip';
  async function make(kind,parentId,title){
   const r=await author.request.post(base+'/api/admin/nodes',{headers:{Origin:base},
    data:{kind,parentId,content:{title,body:title,details:{}}}});
   assert.equal(r.status(),201,await r.text());
   return (await r.json()).id;
  }
  async function publish(id){
   const all=await (await author.request.get(base+'/api/admin/nodes')).json();
   const rev=all.find(n=>n.id===id)?.revision;
   const r=await author.request.post(base+'/api/admin/nodes/'+id+'/publish',{headers:{Origin:base},data:{expectedRevision:rev}});
   assert.equal(r.status(),200,await r.text());
  }
  const series=await make('series',null,prefix+'-world');
  const oldCategory=await make('category',series,prefix+'-old');
  const newCategory=await make('category',series,prefix+'-new');
  const tip=await make('tip',oldCategory,prefix+'-entry');
  const section=await make('tipSection',tip,prefix+'-section');
  const otherSeries=await make('series',null,prefix+'-other-world');
  const otherCategory=await make('category',otherSeries,prefix+'-foreign');
  for(const id of [series,oldCategory,newCategory,tip,section]) await publish(id);
  const readItem=async()=> (await (await anonymous.request.get(base+'/api/public/items/'+tip)).json());
  const snapshot=(await readItem()).content;
  const page=await author.newPage();
  await page.goto(base+'/studio?item='+tip);
  await page.getByRole('heading',{name:'設定：'+prefix+'-entry'}).waitFor();
  await page.getByRole('combobox',{name:'移動先カテゴリ'}).selectOption(newCategory);
  await page.getByRole('button',{name:'カテゴリを変更'}).click();
  await page.getByText('下書きのカテゴリを移動しました。',{exact:false}).waitFor();
  const all=await (await author.request.get(base+'/api/admin/nodes')).json();
  const moved=all.find(n=>n.id===tip);
  assert.equal(moved.parentId,newCategory);
  assert.equal(moved.published.parentId,oldCategory);
  assert.equal(all.find(n=>n.id===section).parentId,tip);
  const treeBefore=await (await anonymous.request.get(base+'/api/public/series/'+series+'/tree')).json();
  assert.equal(treeBefore.find(n=>n.id===tip)?.parentId,oldCategory);
  const pathBefore=await (await anonymous.request.get(base+'/api/public/items/'+tip+'/path')).json();
  assert.deepEqual(pathBefore.map(n=>n.id),[series,oldCategory,tip]);
  assert.deepEqual((await readItem()).content,snapshot);
  const stale=await author.request.post(base+'/api/admin/nodes/'+tip+'/move-category',{headers:{Origin:base},
   data:{expectedRevision:moved.revision-1,targetCategoryId:oldCategory}});
  assert.equal(stale.status(),409);
  const cross=await author.request.post(base+'/api/admin/nodes/'+tip+'/move-category',{headers:{Origin:base},
   data:{expectedRevision:moved.revision,targetCategoryId:otherCategory}});
  assert.equal(cross.status(),400);
  const denied=await anonymous.request.post(base+'/api/admin/nodes/'+tip+'/move-category',
   {headers:{Origin:base},data:{expectedRevision:moved.revision,targetCategoryId:oldCategory}});
  assert.ok([401,403].includes(denied.status()));
  await publish(tip);
  const pathAfter=await (await anonymous.request.get(base+'/api/public/items/'+tip+'/path')).json();
  assert.deepEqual(pathAfter.map(n=>n.id),[series,newCategory,tip]);
  const treeAfter=await (await anonymous.request.get(base+'/api/public/series/'+series+'/tree')).json();
  assert.equal(treeAfter.find(n=>n.id===tip)?.parentId,newCategory);
  assert.equal(treeAfter.filter(n=>n.id===tip).length,1);
  assert.equal((await (await anonymous.request.get(base+'/api/public/items/'+section)).json()).parentId,tip);
 } finally {await browser.close();}
});
