import pg from 'pg';
/** LG-05: author API and Nuxt proxy use stable POS master IDs, without any data migration. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

assert.equal(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB,'1');
assert.notEqual(process.env.NODE_ENV,'production');
const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const roots=[process.env.HTTP_API_URL,process.env.HTTP_BASE_URL];
for(const root of roots) assert.match(root??'',/^http:\/\/127\.0\.0\.1:\d+$/);
const [api,web]=roots;
const headers={Cookie:'eternalia_author='+fixture.authorToken,Origin:web,'Content-Type':'application/json'};
async function request(root,method,path,data) {
  const response=await fetch(root+path,{method,headers,redirect:'manual',...(data===undefined?{}:{body:JSON.stringify(data)})});
  const text=await response.text();let body;try{body=JSON.parse(text)}catch{body=text}
  return {status:response.status,body,text};
}
async function create(root,kind,parentId,title,details={}) {
  const r=await request(root,'POST','/api/admin/nodes',{kind,parentId,content:{title,body:'',details}});
  assert.equal(r.status,201,r.text);return r.body.id;
}
async function authorNode(id) {
  const r=await request(api,'GET','/api/admin/nodes');assert.equal(r.status,200,r.text);
  const node=r.body.find(x=>x.id===id);assert.ok(node);return node;
}
async function publish(id) {
  const n=await authorNode(id);
  const r=await request(api,'POST','/api/admin/nodes/'+id+'/publish',{expectedRevision:n.revision});
  assert.equal(r.status,200,r.text);
}
async function publicMeaning(id) {
  const r=await request(web,'GET','/api/public/items/'+id);
  assert.equal(r.status,200,r.text);
  return JSON.parse(r.body.content.details.meanings)[0];
}
test('LG-05: stable ID survives master rename; draft name does not leak; referenced class cannot be removed', {timeout:120000},async()=>{
  const prefix=fixture.prefix+'-pos-identity-'+randomUUID().slice(0,8);
  const id=randomUUID(),otherId=randomUUID(),senseId=randomUUID();
  const series=await create(api,'series',null,prefix+'-series');
  const language=await create(api,'language',series,prefix+'-language',{
    wordClasses:JSON.stringify([{id,name:'名詞',description:''}]),
  });
  const other=await create(api,'language',series,prefix+'-other',{
    wordClasses:JSON.stringify([{id:otherId,name:'名詞',description:''}]),
  });
  const meanings=posId=>JSON.stringify([{id:senseId,partOfSpeechId:posId,definition:'意味',etymologies:[]}]);
  const word=await create(web,'word',language,prefix+'-word',{meanings:meanings(id)});
  await publish(series);await publish(language);await publish(other);await publish(word);
  const initial=await publicMeaning(word);
  assert.equal(initial.partOfSpeechId,id);
  assert.equal(initial.partOfSpeech,'名詞');
  const beforeWord=await authorNode(word);
  for(const root of roots){
    const wrong=await request(root,'PATCH','/api/admin/nodes/'+word,{
      expectedRevision:beforeWord.revision,
      content:{title:beforeWord.draft.title,body:'',details:{meanings:meanings(otherId)}},
    });
    assert.equal(wrong.status,400,wrong.text);
    assert.equal(wrong.body.statusCode,400);
  }
  assert.deepEqual((await authorNode(word)).draft,beforeWord.draft);
  const change=await request(api,'PATCH','/api/admin/nodes/'+language,{
    expectedRevision:(await authorNode(language)).revision,
    content:{title:prefix+'-language',body:'',details:{wordClasses:JSON.stringify([{id,name:'新しい名詞名',description:''}])}},
  });
  assert.equal(change.status,200,change.text);
  assert.equal((await publicMeaning(word)).partOfSpeech,'名詞', 'unpublished draft name must remain private');
  await publish(language);
  const released=await publicMeaning(word);
  assert.equal(released.partOfSpeechId,id);
  assert.equal(released.partOfSpeech,'新しい名詞名');
  assert.equal((await authorNode(word)).revision,beforeWord.revision,'reference rename must not rewrite word');
  const drop=await request(web,'PATCH','/api/admin/nodes/'+language,{
    expectedRevision:(await authorNode(language)).revision,
    content:{title:prefix+'-language',body:'',details:{wordClasses:'[]'}},
  });
  assert.equal(drop.status,400,drop.text);
  assert.match(drop.body.message,/品詞/);
  assert.deepEqual(await publicMeaning(word),released,'rejecting drop must not alter reader');
  // Independently observe committed draft and published snapshots.
  const dbUrl=new URL(process.env.DATABASE_URL);
  assert.ok(['127.0.0.1','localhost'].includes(dbUrl.hostname)&&dbUrl.pathname==='/eternalia_http','only disposable test database');
  const client=new pg.Client({connectionString:dbUrl.toString()});
  await client.connect();
  try {
    const {rows}=await client.query(`SELECT n.id::text,n.draft_content,n.draft_revision,p.snapshot,p.source_draft_revision
      FROM content_nodes n JOIN published_snapshots p ON p.node_id=n.id WHERE n.id=ANY($1::uuid[])`,[[word,language]]);
    assert.equal(rows.length,2);
    const actualWord=rows.find(x=>x.id===word),actualLanguage=rows.find(x=>x.id===language);
    assert.equal(actualWord.draft_revision,beforeWord.revision);
    assert.equal(JSON.parse(actualWord.draft_content.details.meanings)[0].partOfSpeechId,id);
    assert.equal(JSON.parse(actualWord.snapshot.details.meanings)[0].partOfSpeechId,id);
    for(const value of [actualLanguage.draft_content,actualLanguage.snapshot]){
      const classes=JSON.parse(value.details.wordClasses);
      assert.equal(classes.length,1);assert.equal(classes[0].id,id);assert.equal(classes[0].name,'新しい名詞名');
    }
  }finally{await client.end()}
});
