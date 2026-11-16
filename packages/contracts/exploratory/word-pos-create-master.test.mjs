/** LG-05: direct domain creation cannot bypass the language's POS master. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { newLibrary, createNode, publishNode, toReader } from '../dist/index.js';

const now = Date.UTC(2026,10,16);
const noun = '名詞', verb = '動詞';
const details = (meanings) => ({ meanings: JSON.stringify(meanings.map(([partOfSpeech, definition]) => ({
  id: randomUUID(), partOfSpeech, definition, etymologies: [],
}))) });
const create = (db, kind, parentId, title, fields={}) => {
  const id=randomUUID();return {id,db:createNode(db,{id,kind,parentId,content:{title,body:'',details:fields},now})};
};
const setup = () => {
  let db=newLibrary();
  const series=create(db,'series',null,'系列');db=series.db;
  const language=create(db,'language',series.id,'登録済み言語',{
    wordClasses:JSON.stringify([{id:randomUUID(),name:noun,description:''}]),
  });db=language.db;
  const other=create(db,'language',series.id,'別言語',{
    wordClasses:JSON.stringify([{id:randomUUID(),name:verb,description:''}]),
  });db=other.db;
  const empty=create(db,'language',series.id,'品詞未設定言語');db=empty.db;
  return {db,series:series.id,language:language.id,other:other.id,empty:empty.id};
};
function failedCreate(db,parentId,partOfSpeech) {
  const before=structuredClone(db);
  assert.throws(() => create(db,'word',parentId,'新規不正語', details([[partOfSpeech,'定義']])),
    err => err?.code==='bad-request' && /品詞/.test(err?.message??''));
  assert.deepEqual(db,before,'rejected creation must not mutate revisions, drafts or published snapshots');
}

test('LG-05: registered POS is accepted for new words; multiple meanings can share the class', () => {
  let {db,language}=setup();
  const made=create(db,'word',language,'正しい語', details([[noun,'第一義'],[noun,'第二義']]));
  assert.equal(made.db.nodes.filter(x=>x.kind==='word').length,1);
  assert.equal(JSON.parse(made.db.nodes.find(x=>x.id===made.id).draft.details.meanings).length,2);
});

test('LG-05: nonregistered or cross-language-only POS cannot create words',()=>{
  const {db,language,other,empty}=setup();
  failedCreate(db,language,verb);
  failedCreate(db,empty,noun);
  failedCreate(db,other,noun);
  failedCreate(db,language,'未知');
});

test('LG-05: any unknown class in a multi-meaning create rejects the whole request',()=>{
  const {db,language}=setup();
  assert.throws(()=>create(db,'word',language,'混在',details([[noun,'正規'],[verb,'不正']])),
    err=>err?.code==='bad-request' && /品詞/.test(err?.message??''));
  assert.equal(db.nodes.filter(x=>x.kind==='word').length,0);
});

test('LG-05: no meanings and an explicitly unclassified meaning remain valid in this bounded create Work',()=>{
  let {db,empty}=setup();
  const bare=create(db,'word',empty,'未分類の語');db=bare.db;
  const unspecified=create(db,'word',empty,'未分類の意味',details([['','定義']]));
  assert.equal(unspecified.db.nodes.filter(x=>x.kind==='word').length,2);
});

test('LG-05: rejected duplicate POS input cannot touch existing reader publication',()=>{
  let {db,series,language}=setup();
  const word=create(db,'word',language,'公開語',details([[noun,'公開された意味']]));db=word.db;
  for(const id of [series,language,word.id]){
    const item=db.nodes.find(n=>n.id===id);
    db=publishNode(db,id,item.revision,now);
  }
  const original=toReader(db,word.id,now+1);
  failedCreate(db,language,verb);
  assert.deepEqual(toReader(db,word.id,now+1),original);
});
