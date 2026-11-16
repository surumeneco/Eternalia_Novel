/** LG-05: reject unknown POS in direct author POST via API and Nuxt proxy (real disposable PG). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

assert.equal(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB,'1');
assert.notEqual(process.env.NODE_ENV,'production');
const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const web=process.env.HTTP_BASE_URL,api=process.env.HTTP_API_URL;
for(const url of [web,api])assert.match(url??'',/^http:\/\/127\.0\.0\.1:\d+$/);
const headers={Cookie:'eternalia_author='+fixture.authorToken,Origin:web,'Content-Type':'application/json'};
const request=async(root,method,path,body)=>{
  const response=await fetch(root+path,{method,redirect:'manual',headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
  const raw=await response.text();let parsed;try{parsed=JSON.parse(raw)}catch{parsed=raw}
  return {status:response.status,body:parsed,text:raw};
};
async function create(root,kind,parentId,title,details={}){
  const result=await request(root,'POST','/api/admin/nodes',{kind,parentId,content:{title,body:'',details}});
  assert.equal(result.status,201,result.text);
  return result.body.id;
}
const meaning=(partOfSpeech)=>({meanings:JSON.stringify([{
  id:randomUUID(),partOfSpeech,definition:'意味',etymologies:[],
}])});
const list=async()=>{
  const result=await request(api,'GET','/api/admin/nodes');assert.equal(result.status,200,result.text);return result.body;
};

test('LG-05: Nest and Nuxt reject unknown word POS with 400, preserve data and accept registered POS', {timeout:120000}, async()=>{
  const stamp=fixture.prefix+'-pos-domain-http-'+randomUUID().slice(0,8);
  const world=await create(api,'series',null,stamp+'-series');
  const classes={wordClasses:JSON.stringify([{id:randomUUID(),name:'名詞',description:''}])};
  const language=await create(api,'language',world,stamp+'-language',classes);
  const empty=await create(api,'language',world,stamp+'-empty-language');
  const before=(await list()).length;
  for(const root of [api,web]){
    for(const [parentId,pos] of [[language,'動詞'],[language,'未知'],[empty,'名詞']]){
      const rejected=await request(root,'POST','/api/admin/nodes',{
        kind:'word',parentId,content:{title:stamp+'-rejected-'+randomUUID(),body:'',details:meaning(pos)},
      });
      assert.equal(rejected.status,400,root+' should reject '+pos+': '+rejected.text);
      assert.equal(rejected.body.code,'bad-request');
      assert.match(rejected.body.message,/品詞/);
    }
  }
  assert.equal((await list()).length,before,'rejected direct POST must not commit extra nodes');
  const accepted=await create(web,'word',language,stamp+'-accepted',meaning('名詞'));
  assert.ok((await list()).some(x=>x.id===accepted));
  const noPos=await create(api,'word',empty,stamp+'-unclassified',meaning(''));
  assert.ok((await list()).some(x=>x.id===noPos));
  const hidden=await fetch(web+'/api/public/items/'+accepted);
  assert.equal(hidden.status,404,'new draft-only word has no public snapshot');
});
