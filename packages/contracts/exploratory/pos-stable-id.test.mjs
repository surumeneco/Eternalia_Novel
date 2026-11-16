import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { newLibrary, createNode, editNode, publishNode, toReader, parseWordMeanings } from '../dist/index.js';

const t = Date.UTC(2026, 10, 16);
const content = (title, details = {}) => ({title, body: '', details});
const create = (db, kind, parentId, title, details = {}) => {
  const id = randomUUID();
  return { id, db: createNode(db, {id, kind, parentId, content: content(title, details), now:t}) };
};
const classId = randomUUID();
const noun = (name='名詞') => JSON.stringify([{id:classId, name, description:''}]);
const meaning = id => JSON.stringify([{id:randomUUID(), partOfSpeechId:id, definition:'意味', etymologies:[]}]);
const fixture = () => {
  let db=newLibrary();let x=create(db,'series',null,'世界');const series=x.id;db=x.db;
  x=create(db,'language',series,'言語',{wordClasses:noun()});const language=x.id;db=x.db;
  x=create(db,'word',language,'語',{meanings:meaning(classId)});const word=x.id;db=x.db;
  return {db,series,language,word};
};
test('LG-05 stable class ID survives rename without changing the word or its meaning',()=>{
  let {db,language,word,series}=fixture();
  for (const id of [series,language,word]) db=publishNode(db,id,1,t);
  const initial=JSON.parse(toReader(db,word,t+1).content.details.meanings)[0];
  assert.equal(initial.partOfSpeechId,classId);
  assert.equal(initial.partOfSpeech,'名詞');
  const renamed=editNode(db,language,1,content('言語',{wordClasses:noun('名詞（新名称）')}),t+2);
  assert.equal(JSON.parse(toReader(renamed,word,t+3).content.details.meanings)[0].partOfSpeech,'名詞','draft cannot change public label');
  const published=publishNode(renamed,language,2,t+4);
  const reader=JSON.parse(toReader(published,word,t+5).content.details.meanings)[0];
  assert.equal(reader.partOfSpeechId,classId);
  assert.equal(reader.partOfSpeech,'名詞（新名称）');
  assert.equal(JSON.parse(published.nodes.find(n=>n.id===word).draft.details.meanings)[0].partOfSpeechId,classId);
});
test('LG-05 referenced class cannot be deleted while word still refers to it',()=>{
  const {db,language}=fixture();
  assert.throws(()=>editNode(db,language,1,content('言語',{wordClasses:'[]'}),t+1),e=>e.code==='bad-request');
});
test('LG-05 IDs from another language and unknown IDs cannot be saved',()=>{
  let {db,series,language,word}=fixture();
  const other=create(db,'language',series,'別言語',{wordClasses:JSON.stringify([{id:randomUUID(),name:'名詞',description:''}])});
  db=other.db;
  const foreign=JSON.parse(db.nodes.find(n=>n.id===other.id).draft.details.wordClasses)[0].id;
  assert.throws(()=>create(db,'word',language,'不正',{meanings:meaning(foreign)}),e=>e.code==='bad-request');
  assert.throws(()=>editNode(db,word,1,content('語',{meanings:meaning(foreign)}),t+1),e=>e.code==='bad-request');
});
test('LG-05 missing published class label does not reveal draft name',()=>{
  let {db,series,language,word}=fixture();
  for (const id of [series,language,word]) db=publishNode(db,id,1,t);
  const lang=db.nodes.find(n=>n.id===language);
  // Directly emulate a stale published snapshot where the new class is draft-only.
  const modified=structuredClone(db);
  modified.nodes.find(n=>n.id===language).published.value.details.wordClasses='[]';
  const reader=JSON.parse(toReader(modified,word,t+1).content.details.meanings)[0];
  assert.equal(reader.partOfSpeech,undefined);
  assert.equal(reader.partOfSpeechId,'', 'draft-only class identifier must also remain private');
});
test('LG-05 name-string POS is not a valid new alpha stored meaning',()=>{
  assert.throws(()=>parseWordMeanings(JSON.stringify([{id:randomUUID(),partOfSpeech:'名詞',definition:'意味',etymologies:[]}])),e=>e.code==='bad-request');
});
