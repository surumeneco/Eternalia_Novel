// Exploratory behavior checks. CAT model, vectors and executable test ownership remain separate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { newLibrary, createNode, diagnoseWordSpelling } from '../dist/index.js';

const now=Date.UTC(2026,9,29);
function create(db,kind,parentId,title,details={}) {
  const id=randomUUID();
  return {id,db:createNode(db,{id,kind,parentId,content:{title,body:'',details},now})};
}
test('same-language duplicate is reported but different language or series is not',()=>{
 let db=newLibrary();
 const series=create(db,'series',null,'世界');db=series.db;
 const firstLang=create(db,'language',series.id,'甲');db=firstLang.db;
 const secondLang=create(db,'language',series.id,'乙');db=secondLang.db;
 const wordA=create(db,'word',firstLang.id,'luma');db=wordA.db;
 const wordB=create(db,'word',firstLang.id,'luma');db=wordB.db;
 const foreign=create(db,'word',secondLang.id,'luma');db=foreign.db;
 assert.equal(diagnoseWordSpelling(db,wordB.id,'luma')[0]?.code,'duplicate-spelling');
 assert.equal(diagnoseWordSpelling(db,foreign.id,'luma').length,0);
 assert.equal(diagnoseWordSpelling(db,wordA.id,'luma').length,1);
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
