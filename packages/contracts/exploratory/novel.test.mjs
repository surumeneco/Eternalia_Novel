// Exploratory, not CAT-derived or normative tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newLibrary, createNode, editNode, publishNode, setVisibility, publicSeries,
  toReader, publicTree, publicRecent, parseWordMeanings } from '../dist/index.js';
import { randomUUID } from 'node:crypto';
const now = Date.UTC(2026,9,28);
function create(db,kind,parentId=null,title=kind,details={}) {
  const id=randomUUID(); return {id,db:createNode(db,{id,kind,parentId,content:{title,body:kind+' body',details},now})};
}
function publish(db,id,time=now){const n=db.nodes.find(n=>n.id===id);return publishNode(db,id,n.revision,time);}
function visibility(db,id,isPublic,publicSince=now){const n=db.nodes.find(n=>n.id===id);return setVisibility(db,id,n.revision,isPublic,publicSince,now);}
function sampleStory(){let db=newLibrary();const s=create(db,'series',null,'世界A');db=s.db;const v=create(db,'volume',s.id);db=v.db;const p=create(db,'part',v.id);db=p.db;const c=create(db,'chapter',p.id,'第一章');db=c.db;return {db,s:s.id,v:v.id,p:p.id,c:c.id};}
test('unpublished ancestor hides published child; publishing chain reveals',()=>{let {db,s,v,p,c}=sampleStory();db=publish(db,c);assert.equal(toReader(db,c,now+1),null);db=publish(db,s);db=publish(db,v);db=publish(db,p);assert.equal(toReader(db,c,now+1).content.title,'第一章');assert.equal(publicSeries(db,now+1).length,1);assert.equal(publicTree(db,s,now+1).length,4);});
test('private parent suppresses child without changing child flag or published snapshot',()=>{let {db,s,v,p,c}=sampleStory();for(const id of [s,v,p,c])db=publish(db,id);db=visibility(db,v,false);assert.equal(toReader(db,c,now+1),null);assert.equal(db.nodes.find(n=>n.id===c).isPublic,true);db=visibility(db,v,true);assert.equal(toReader(db,c,now+1)?.content.title,'第一章');});
test('future publication time blocks direct reads and collection',()=>{let {db,s,v,p,c}=sampleStory();for(const id of [s,v,p,c])db=publish(db,id);db=visibility(db,s,true,now+60000);assert.equal(publicSeries(db,now+59999).length,0);assert.equal(toReader(db,c,now+59999),null);assert.equal(publicSeries(db,now+60000).length,1);});
test('draft save cannot change reader snapshot until explicit publish',()=>{let {db,s,v,p,c}=sampleStory();for(const id of [s,v,p,c])db=publish(db,id);const revision=db.nodes.find(n=>n.id===c).revision;db=editNode(db,c,revision,{title:'第二稿',body:'新しい文章',details:{}},now);assert.equal(toReader(db,c,now+1).content.title,'第一章');assert.throws(()=>editNode(db,c,revision,{title:'競合',body:'',details:{}},now),e=>e.code==='conflict');const nextRevision=db.nodes.find(n=>n.id===c).revision;db=publishNode(db,c,nextRevision,now);assert.equal(toReader(db,c,now+1).content.title,'第二稿');});
test('category presets copy only on new tip, then remain independent',()=>{let db=newLibrary();const s=create(db,'series');db=s.db;const cat=create(db,'category',s.id,'人物',{presets:JSON.stringify([{title:'年齢',body:'未設定'},{title:'性格',body:''}])});db=cat.db;const first=create(db,'tip',cat.id,'A');db=first.db;let sections=db.nodes.filter(n=>n.parentId===first.id);assert.equal(sections.length,2);assert.equal(sections[0].draft.title,'年齢');db=editNode(db,cat.id,1,{title:'人物',body:'',details:{presets:JSON.stringify([{title:'役職',body:'新規'}])}},now);const second=create(db,'tip',cat.id,'B');db=second.db;sections=db.nodes.filter(n=>n.parentId===first.id);assert.equal(sections.length,2);assert.equal(sections[0].draft.title,'年齢');assert.equal(db.nodes.filter(n=>n.parentId===second.id)[0].draft.title,'役職');});
test('category nested under category is invalid; domains cannot cross series',()=>{let db=newLibrary();const s=create(db,'series');db=s.db;const c=create(db,'category',s.id);db=c.db;assert.throws(()=>createNode(db,{id:randomUUID(),kind:'category',parentId:c.id,content:{title:'NG',body:'',details:{}},now}),e=>e.code==='bad-request');});
test('word defaults public but without snapshot cannot be read',()=>{let db=newLibrary();const s=create(db,'series');db=s.db;const l=create(db,'language',s.id);db=l.db;const w=create(db,'word',l.id);db=w.db;assert.equal(db.nodes.find(n=>n.id===w.id).isPublic,true);assert.equal(toReader(db,w.id,now+1),null);});
test('independent tipSection publication and grammar publication',()=>{let db=newLibrary();const s=create(db,'series');db=s.db;const c=create(db,'category',s.id);db=c.db;const t=create(db,'tip',c.id);db=t.db;const sec1=create(db,'tipSection',t.id,'公開項目');db=sec1.db;const sec2=create(db,'tipSection',t.id,'未公開項目');db=sec2.db;const lang=create(db,'language',s.id);db=lang.db;const gram=create(db,'grammar',lang.id);db=gram.db;for(const id of [s.id,c.id,t.id,sec1.id,sec2.id,lang.id,gram.id])db=publish(db,id);db=visibility(db,sec2.id,false);assert.equal(toReader(db,sec1.id,now+1).content.title,'公開項目');assert.equal(toReader(db,sec2.id,now+1),null);assert.notEqual(toReader(db,gram.id,now+1),null);});
test('unsafe content and overly large inputs rejected',()=>{const s=create(newLibrary(),'series');assert.throws(()=>editNode(s.db,s.id,1,{title:'',body:'',details:{}},now),e=>e.code==='bad-request');assert.throws(()=>editNode(s.db,s.id,1,{title:'x',body:'z'.repeat(100001),details:{}},now),e=>e.code==='bad-request');});

test('private category presets must never appear in public API payload',()=>{let db=newLibrary();const s=create(db,'series');db=s.db;const cat=create(db,'category',s.id,'人物',{presets:JSON.stringify([{title:'作者だけの秘密',body:'秘密' }])});db=cat.db;for(const id of [s.id,cat.id])db=publish(db,id);const visible=toReader(db,cat.id,now+1);assert.deepEqual(visible.content.details,{});assert.ok(!JSON.stringify(publicTree(db,s.id,now+1)).includes('作者だけの秘密'));});

test('recent feed contains only currently readable publication snapshots', () => {
  let { db, s, v, p, c } = sampleStory();
  for (const id of [s, v, p, c]) db = publish(db, id, now);
  assert.deepEqual(publicRecent(db, now + 1).map(n => n.id), [c]);
  db = visibility(db, v, false);
  assert.equal(publicRecent(db, now + 1).length, 0, 'private ancestor cannot leak through recent');
  db = visibility(db, v, true);
  db = editNode(db, c, db.nodes.find(n => n.id === c).revision,
    { title: '未公開の変更', body: '未公開の秘密', details: {} }, now + 1);
  assert.ok(!JSON.stringify(publicRecent(db, now + 1)).includes('未公開の秘密'));
  db = visibility(db, c, true, now + 60000);
  assert.equal(publicRecent(db, now + 1).length, 0, 'scheduled content is not a recent item yet');
  assert.equal(publicRecent(db, now + 60000).length, 1);
  assert.equal(publicRecent(db, now + 60000)[0].content.title, '第一章');
});

test('same-part-of-speech meanings retain independent etymologies and snapshots', () => {
  let db = newLibrary();
  const series = create(db, 'series', null, '世界'); db = series.db;
  const lang1 = create(db, 'language', series.id, 'A語'); db = lang1.db;
  const lang2 = create(db, 'language', series.id, 'B語'); db = lang2.db;
  const source = create(db, 'word', lang2.id, '根'); db = source.db;
  const word = create(db, 'word', lang1.id, '詞'); db = word.db;
  const meanings = [
    { id: randomUUID(), partOfSpeech:'名詞', definition:'第一の意味', etymologies:[
      { id:randomUUID(),languageId:lang2.id,wordId:source.id,note:'古語から' },
    ] },
    { id: randomUUID(), partOfSpeech:'名詞', definition:'第二の意味', etymologies:[
      { id:randomUUID(),languageId:lang2.id,note:'別系統' },
    ] },
  ];
  db = editNode(db, word.id, 1,
    { title:'詞',body:'',details:{meanings:JSON.stringify(meanings)} }, now);
  assert.equal(parseWordMeanings(db.nodes.find(n => n.id === word.id).draft.details.meanings).length, 2);
  for (const id of [series.id,lang1.id,lang2.id,source.id,word.id]) db = publish(db,id);
  const original = toReader(db,word.id,now+1);
  const released = JSON.parse(original.content.details.meanings);
  assert.equal(released.length,2);
  assert.equal(released[0].etymologies[0].wordTitle,'根');
  assert.notEqual(released[0].id,released[1].id);
  db = editNode(db, word.id, db.nodes.find(n => n.id === word.id).revision,
    { title:'詞',body:'',details:{meanings:JSON.stringify([meanings[0]])}},now+2);
  assert.equal(JSON.parse(toReader(db,word.id,now+3).content.details.meanings).length,2,
    'saved draft must not mutate published meanings');
  db = visibility(db,source.id,false);
  const restricted = JSON.parse(toReader(db,word.id,now+4).content.details.meanings);
  assert.equal(restricted[0].etymologies[0].wordId,undefined,'private referenced word ID must be omitted');
  assert.equal(restricted[0].etymologies[0].wordTitle,undefined,'private referenced word title must be omitted');
  assert.equal(restricted[0].etymologies[0].languageTitle,'B語','public language may remain visible');
});
test('meanings validate referential consistency and distinct identities', () => {
  let db = newLibrary();
  const a = create(db,'series'); db = a.db;
  const b = create(db,'series'); db = b.db;
  const language = create(db,'language',a.id); db = language.db;
  const foreign = create(db,'language',b.id); db = foreign.db;
  const word = create(db,'word',language.id); db = word.db;
  const id = randomUUID();
  const base = {id,partOfSpeech:'名詞',definition:'意味',etymologies:[]};
  const payload = meanings => ({ title:'項目',body:'',details:{meanings:JSON.stringify(meanings)} });
  assert.throws(() => editNode(db,word.id,1,payload([base,{...base,definition:'別の意味'}]),now),
    e => e.code === 'bad-request','duplicate meaning IDs are forbidden');
  assert.throws(() => editNode(db,word.id,1,payload([{
    ...base,etymologies:[{id:randomUUID(),languageId:foreign.id,note:'別シリーズ'}],
  }]),now), e => e.code === 'bad-request','cross-series etymology is forbidden');
});
