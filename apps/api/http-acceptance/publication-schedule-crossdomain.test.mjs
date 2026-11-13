/** PB-05/AC-45/54/55/70: real Nuxt proxy, Nest and PostgreSQL privacy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;
const api=process.env.HTTP_API_URL;
const future=Date.parse('2099-07-08T00:15:00.000Z');

async function request(method,path,data,token=fixture.authorToken,origin=base){
 const res=await fetch(origin+path,{method,redirect:'manual',headers:{
  Origin:base,'Content-Type':'application/json',
  ...(token?{Cookie:'eternalia_author='+token}:{}),
 },...(data===undefined?{}:{body:JSON.stringify(data)})});
 const body=await res.text();
 return {status:res.status,body,json:()=>{
   try{return JSON.parse(body)}catch{return null}
 }};
}
async function authorNode(id){
 const result=await request('GET','/api/admin/nodes');
 assert.equal(result.status,200,result.body);
 const found=result.json().find(n=>n.id===id);
 assert.ok(found,'missing author node '+id);
 return found;
}
async function setSchedule(id,publicSince,isPublic=true,token=fixture.authorToken){
 const node=await authorNode(id);
 return request('POST','/api/admin/nodes/'+id+'/visibility',{
  expectedRevision:node.revision,isPublic,publicSince,
 },token);
}
async function create(kind,parentId,name){
 const content={title:name,body:'published:'+name,details:{}};
 const response=await request('POST','/api/admin/nodes',{kind,parentId,content});
 assert.equal(response.status,201,response.body);
 return response.json().id;
}
async function publish(id){
 const node=await authorNode(id);
 const result=await request('POST','/api/admin/nodes/'+id+'/publish',{
  expectedRevision:node.revision,
 });
 assert.equal(result.status,200,result.body);
}
const lookup=async (path,root=base)=>{
 const response=await request('GET',path,undefined,null,root);
 return response;
};
const idsOf=value=>new Set(value.json()?.map?.(x=>x.id)??[]);

test('AC-45/54/55/70: scheduled four-domain records never leak, clear restores same snapshots, ancestor blocks all',
 {timeout:120_000},async()=>{
 const prefix=fixture.prefix+'-scheduled-ac';
 const series=await create('series',null,prefix+'-series');
 const volume=await create('volume',series,prefix+'-volume');
 const part=await create('part',volume,prefix+'-part');
 const chapter=await create('chapter',part,prefix+'-chapter');
 const category=await create('category',series,prefix+'-category');
 const tip=await create('tip',category,prefix+'-tip');
 const language=await create('language',series,prefix+'-language');
 const word=await create('word',language,prefix+'-word');
 const period=await create('periodization',series,prefix+'-period');
 const event=await create('event',period,prefix+'-event');
 const all=[series,volume,part,chapter,category,tip,language,word,period,event];
 const leaves=[chapter,tip,word,event];
 for(const id of all)await publish(id);
 const initial=new Map();
 for(const id of leaves){
  const detail=await lookup('/api/public/items/'+id);
  assert.equal(detail.status,200,'initially visible '+id);
  initial.set(id,detail.json().content);
 }
 for(const id of leaves){
  const response=await setSchedule(id,future);
  assert.equal(response.status,200,response.body);
  assert.equal((await authorNode(id)).publicSince,future,'UTC epoch must persist exactly');
 }
 for(const root of [base,api]){
  for(const id of leaves){
   const detail=await lookup('/api/public/items/'+id,root);
   assert.equal(detail.status,404,'future item direct URL: '+root+' '+id);
   assert.equal((await lookup('/api/public/items/'+id+'/path',root)).status,404,
     'future item breadcrumb: '+root+' '+id);
   assert.ok(!detail.body.includes(prefix),'hidden title in error response');
  }
  const tree=await lookup('/api/public/series/'+series+'/tree',root);
  assert.equal(tree.status,200,tree.body);
  for(const id of leaves)assert.equal(idsOf(tree).has(id),false,'future item in tree');
  const recent=await lookup('/api/public/recent',root);
  assert.equal(recent.status,200,recent.body);
  for(const id of leaves)assert.equal(idsOf(recent).has(id),false,'future item in recent');
 }
 // A valid non-author synthetic session cannot reschedule anyone else's item.
 const before=await authorNode(chapter);
 const denied=await setSchedule(chapter,null,true,fixture.outsiderToken);
 assert.equal(denied.status,401,denied.body);
 assert.equal((await authorNode(chapter)).revision,before.revision);

 for(const id of leaves){
  const result=await setSchedule(id,null);
  assert.equal(result.status,200,result.body);
  for(const root of [base,api]){
   const restored=await lookup('/api/public/items/'+id,root);
   assert.equal(restored.status,200,'cleared schedule '+id+' via '+root);
   assert.deepEqual(restored.json().content,initial.get(id),'publish snapshot must not change');
  }
 }
 // An ancestor's schedule must conceal all published descendants.
 assert.equal((await setSchedule(series,future)).status,200);
 for(const root of [base,api]){
  const allSeries=await lookup('/api/public/series',root);
  assert.equal(allSeries.status,200);
  assert.equal(idsOf(allSeries).has(series),false);
  const tree=await lookup('/api/public/series/'+series+'/tree',root);
  if(tree.status===200){
   assert.equal(idsOf(tree).has(series),false);
   for(const id of leaves)assert.equal(idsOf(tree).has(id),false);
  }else assert.equal(tree.status,404);
  const recent=await lookup('/api/public/recent',root);
  for(const id of leaves)assert.equal(idsOf(recent).has(id),false);
  for(const id of leaves)assert.equal((await lookup('/api/public/items/'+id,root)).status,404);
 }
 assert.equal((await setSchedule(series,null)).status,200);
 for(const id of leaves){
  const again=await lookup('/api/public/items/'+id);
  assert.equal(again.status,200,'restored after parent release');
  assert.deepEqual(again.json().content,initial.get(id));
 }
 // Avoid leaking the test-only series into later shared HTTP assertions.
 assert.equal((await setSchedule(series,null,false)).status,200);
 assert.equal((await lookup('/api/public/items/'+chapter)).status,404);
 assert.equal((await lookup('/api/public/items/'+fixture.chapter)).status,200,
   'existing fixture author content must remain unaffected');
});
