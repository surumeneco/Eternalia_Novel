/** AC-76 disposable-DB author/anonymous Chromium acceptance. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;
test('AC-76: nonpublic leaf soft-delete, dependent refusal and reader privacy', {timeout:90_000},async()=>{
 assert.ok(base?.startsWith('http://127.0.0.1:'));
 const browser=await chromium.launch({headless:true});
 try {
  const author=await browser.newContext();
  await author.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
  const anon=await browser.newContext();
  const prefix=fixture.prefix+'-soft-delete';
  async function create(kind,parentId,name){
   const r=await author.request.post(base+'/api/admin/nodes',{headers:{Origin:base},
    data:{kind,parentId,content:{title:prefix+'-'+name,body:'本文-'+name,details:{}}}});
   assert.equal(r.status(),201,await r.text());return(await r.json()).id;
  }
  const nodes=async()=>(await(await author.request.get(base+'/api/admin/nodes')).json());
  const revision=async(id)=>(await nodes()).find(n=>n.id===id)?.revision;
  async function publish(id){
   const r=await author.request.post(base+'/api/admin/nodes/'+id+'/publish',{headers:{Origin:base},
    data:{expectedRevision:await revision(id)}});
   assert.equal(r.status(),200,await r.text());
  }
  async function visibility(id,value){
   const r=await author.request.post(base+'/api/admin/nodes/'+id+'/visibility',{headers:{Origin:base},
    data:{expectedRevision:await revision(id),isPublic:value,publicSince:null}});
   assert.equal(r.status(),200,await r.text());
  }
  const series=await create('series',null,'series');
  const category=await create('category',series,'category');
  const tip=await create('tip',category,'leaf');
  for(const id of [series,category,tip])await publish(id);
  const pre=await anon.request.get(base+'/api/public/items/'+tip);
  assert.equal(pre.status(),200);
  // Deleting published-visible content is forbidden even for the author.
  let response=await author.request.post(base+'/api/admin/nodes/'+tip+'/soft-delete',{headers:{Origin:base},
   data:{expectedRevision:await revision(tip)}});
  assert.equal(response.status(),400);
  await visibility(category,false);
  response=await author.request.post(base+'/api/admin/nodes/'+category+'/soft-delete',{headers:{Origin:base},
   data:{expectedRevision:await revision(category)}});
  assert.equal(response.status(),400,'existing Tip child prevents cascaded deletion');
  await visibility(category,true);
  await visibility(tip,false);
  const originalRevision=await revision(tip);
  const stale=await author.request.post(base+'/api/admin/nodes/'+tip+'/soft-delete',{headers:{Origin:base},
   data:{expectedRevision:originalRevision-1}});
  assert.equal(stale.status(),409);
  const denied=await anon.request.post(base+'/api/admin/nodes/'+tip+'/soft-delete',
   {headers:{Origin:base},data:{expectedRevision:originalRevision}});
  assert.ok([401,403].includes(denied.status()));
  // Actual editor button asks for explicit destructive-action confirmation.
  const page=await author.newPage();
  await page.goto(base+'/studio?item='+tip);
  await page.getByRole('heading',{name:'設定：'+prefix+'-leaf'}).waitFor();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'この非公開項目を削除'}).click();
  await page.getByText('論理削除しました。',{exact:false}).waitFor();
  assert.equal((await nodes()).some(n=>n.id===tip),false);
  assert.equal((await anon.request.get(base+'/api/public/items/'+tip)).status(),404);
  const tree=await(await anon.request.get(base+'/api/public/series/'+series+'/tree')).json();
  assert.equal(tree.some(n=>n.id===tip),false);
  assert.equal((await anon.request.get(base+'/api/public/items/'+tip+'/path')).status(),404);
  response=await author.request.post(base+'/api/admin/nodes/'+tip+'/publish',{headers:{Origin:base},
    data:{expectedRevision:originalRevision+1}});
  assert.equal(response.status(),404,'deleted IDs cannot be republished');
 }finally{await browser.close()}
});
