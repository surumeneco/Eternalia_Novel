// Exploratory behavior checks. CAT model, vectors and executable test ownership remain separate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { newLibrary, createNode, editNode, publishNode, diagnoseWordSpelling, appendDuplicateWordMeaning, parseWordMeanings, setVisibility, softDeleteNode } from '../dist/index.js';

const now=Date.UTC(2026,9,29);
function create(db,kind,parentId,title,details={}) {
  const id=randomUUID();
  return {id,db:createNode(db,{id,kind,parentId,content:{title,body:'',details},now})};
}
test('same-language duplicates are rejected without mutation, but cross-language homographs are permitted',()=>{
 let db=newLibrary();
 const series=create(db,'series',null,'世界');db=series.db;
 const firstLang=create(db,'language',series.id,'甲');db=firstLang.db;
 const secondLang=create(db,'language',series.id,'乙');db=secondLang.db;
 const wordA=create(db,'word',firstLang.id,'luma');db=wordA.db;
 const other=create(db,'word',firstLang.id,'lume');db=other.db;
 const original=structuredClone(db);
 assert.throws(()=>create(db,'word',firstLang.id,' luma '),e=>e.code==='duplicate-spelling' &&
   e.existingWordId===wordA.id);
 assert.deepEqual(db,original,'refused create must not mutate source');
 assert.throws(()=>editNode(db,other.id,1,{title:'luma',body:'',details:{}},now),
   e=>e.code==='duplicate-spelling' && e.existingWordId===wordA.id);
 assert.deepEqual(db,original,'refused rename must not mutate source');
 const foreign=create(db,'word',secondLang.id,'luma');db=foreign.db;
 assert.equal(diagnoseWordSpelling(db,foreign.id,'luma').length,0);
 assert.equal(diagnoseWordSpelling(db,wordA.id,'luma').length,0);
 assert.equal(diagnoseWordSpelling(db,other.id,'luma')[0]?.code,'duplicate-spelling');
});

test('rejected duplicate meaning inserts at end of matching part of speech without saving or altering publication',()=>{
 const id1=randomUUID(),id2=randomUUID(),id3=randomUUID(),id4=randomUUID(),id5=randomUUID();
 const nounId=randomUUID(), verbId=randomUUID(), adjectiveId=randomUUID();
 const before=[
   {id:id1,partOfSpeechId:nounId,definition:'古い名詞1',etymologies:[]},
   {id:id2,partOfSpeechId:verbId,definition:'古い動詞',etymologies:[]},
   {id:id3,partOfSpeechId:nounId,definition:'古い名詞2',etymologies:[]},
   {id:id4,partOfSpeechId:adjectiveId,definition:'古い形容詞',etymologies:[]},
 ];
 const original=JSON.stringify(before);
 const merged=appendDuplicateWordMeaning(original,{id:id5,partOfSpeechId:nounId,definition:'未保存の新しい名詞'});
 assert.deepEqual(parseWordMeanings(merged).map(v=>v.id),[id1,id2,id3,id5,id4]);
 assert.equal(parseWordMeanings(merged)[3]?.definition,'未保存の新しい名詞');
 assert.equal(JSON.stringify(before),original,'source author/published array must not be mutated');
 assert.throws(()=>parseWordMeanings(appendDuplicateWordMeaning('[]',{id:randomUUID(),partOfSpeechId:'',definition:''})),
   'incomplete entry requires author editing before it can be saved');
});

test('multi-character glyphs and phonological transitions are evaluated without mutation',()=>{
 let db=newLibrary();
 const series=create(db,'series',null,'世界');db=series.db;
 const a=randomUUID(),b=randomUUID(),c=randomUUID();
 const chars=[
   {id:a,glyph:'sh',pronunciation:'ʃ',canStart:true,canEnd:false,nextIds:[b]},
   {id:b,glyph:'a',pronunciation:'a',canStart:false,canEnd:true,nextIds:[c]},
   {id:c,glyph:'n',pronunciation:'n',canStart:false,canEnd:true,nextIds:[]},
 ];
 const language=create(db,'language',series.id,'言語',{characters:JSON.stringify(chars)});db=language.db;
 const word=create(db,'word',language.id,'shan');db=word.db;
 const original=JSON.stringify(db);
 assert.deepEqual(diagnoseWordSpelling(db,word.id,'shan'),[]);
 assert.deepEqual(diagnoseWordSpelling(db,word.id,'sha'),[]);
 assert.equal(diagnoseWordSpelling(db,word.id,'shn')[0]?.code,'phonotactics');
 assert.equal(diagnoseWordSpelling(db,word.id,'zz')[0]?.code,'unknown-alphabet');
 assert.equal(JSON.stringify(db),original,'diagnostics must not mutate library');
});
test('language without a character registry permits exploratory spellings',()=>{
 let db=newLibrary(); const s=create(db,'series',null,'世界');db=s.db;
 const l=create(db,'language',s.id,'語');db=l.db;const w=create(db,'word',l.id,'任意');db=w.db;
 assert.deepEqual(diagnoseWordSpelling(db,w.id,'任意'),[]);
});


test('LG-08: editor duplicate diagnostic reserves a retained published spelling after draft rename',()=>{
 let db=newLibrary();
 const series=create(db,'series',null,'世界');db=series.db;
 const lang=create(db,'language',series.id,'語');db=lang.db;
 const original=create(db,'word',lang.id,'X');db=original.db;
 db=publishNode(db,original.id,db.nodes.find(x=>x.id===original.id).revision,now);
 db=editNode(db,original.id,db.nodes.find(x=>x.id===original.id).revision,{title:'Y',body:'',details:{}},now+1);
 const editing=create(db,'word',lang.id,'Z');db=editing.db;
 const before=structuredClone(db);
 assert.equal(diagnoseWordSpelling(db,editing.id,'X')[0]?.code,'duplicate-spelling',
   'retained published X must reserve the spelling even though its draft is Y');
 assert.equal(diagnoseWordSpelling(db,editing.id,'Y')[0]?.code,'duplicate-spelling');
 assert.equal(diagnoseWordSpelling(db,editing.id,'Z').some(x=>x.code==='duplicate-spelling'),false);
 assert.deepEqual(db,before,'diagnostic must not mutate source or publication');
 db=publishNode(db,original.id,db.nodes.find(x=>x.id===original.id).revision,now+2);
 assert.equal(diagnoseWordSpelling(db,editing.id,'X').some(x=>x.code==='duplicate-spelling'),false,
   'publishing Y explicitly releases the previous published X');
});

test('LG-08: editor duplicate diagnostic ignores soft-deleted words but not simply private ones',()=>{
 let db=newLibrary();
 const series=create(db,'series',null,'世界');db=series.db;
 const lang=create(db,'language',series.id,'語');db=lang.db;
 const original=create(db,'word',lang.id,'X');db=original.db;
 const editing=create(db,'word',lang.id,'Z');db=editing.db;
 db=publishNode(db,original.id,db.nodes.find(x=>x.id===original.id).revision,now);
 db=setVisibility(db,original.id,db.nodes.find(x=>x.id===original.id).revision,false,null,now+1);
 assert.equal(diagnoseWordSpelling(db,editing.id,'X')[0]?.code,'duplicate-spelling',
   'making the existing word private does not release X');
 db=softDeleteNode(db,original.id,db.nodes.find(x=>x.id===original.id).revision,now+2);
 const before=structuredClone(db);
 assert.equal(diagnoseWordSpelling(db,editing.id,'X').some(x=>x.code==='duplicate-spelling'),false,
   'a logically deleted word must not reserve its spelling');
 assert.deepEqual(db,before);
});
