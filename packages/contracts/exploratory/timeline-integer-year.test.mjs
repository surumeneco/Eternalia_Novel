import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNode, editNode, newLibrary, parseRelativeYear, compareEventsWithinPeriod,
  publishNode, toReader,
} from '../dist/index.js';

const now=1_800_000_000_000;
const id={
  series:'11111111-1111-4111-8111-111111111111',
  period:'22222222-2222-4222-8222-222222222222',
  event:'33333333-3333-4333-8333-333333333333',
};
const content=(title,details={})=>({title,body:title,details});
test('TL-03: integer years include zero/negative but not decimals, exponents or unsafe values',()=>{
 for(const [raw,value] of [['0',0],['-1',-1],['+7',7],['  -101  ',-101],['9007199254740991',Number.MAX_SAFE_INTEGER]]){
   assert.equal(parseRelativeYear(raw),value,raw);
 }
 for(const raw of ['',undefined,'1.5','-0.25','1e6','0x12','9007199254740992',
                   '-9007199254740992','--10','Inf','-Infinity','1_000']){
   assert.equal(parseRelativeYear(raw),null,String(raw));
 }
});
test('TL-03: period offset and event year remain separate, lossless, unpublished drafts',()=>{
 let db=newLibrary();
 db=createNode(db,{id:id.series,kind:'series',content:content('世界'),now});
 db=createNode(db,{id:id.period,kind:'periodization',parentId:id.series,content:content('暦A',{relativeYears:'-42'}),now});
 db=createNode(db,{id:id.event,kind:'event',parentId:id.period,content:content('年0',{year:'0'}),now});
 assert.equal(db.nodes.find(n=>n.id===id.period).draft.details.relativeYears,'-42');
 assert.equal(db.nodes.find(n=>n.id===id.event).draft.details.year,'0');
 for(const k of ['series','period','event'])db=publishNode(db,id[k],db.nodes.find(n=>n.id===id[k]).revision,now+1);
 assert.equal(toReader(db,id.event,now+2)?.content.details.year,'0');
 db=editNode(db,id.event,db.nodes.find(n=>n.id===id.event).revision,
  content('前年',{year:'-1'}),now+3);
 assert.equal(db.nodes.find(n=>n.id===id.event).draft.details.year,'-1');
 assert.equal(toReader(db,id.event,now+4)?.content.details.year,'0',
   'draft must not leak before explicit republish');
 db=publishNode(db,id.event,db.nodes.find(n=>n.id===id.event).revision,now+5);
 assert.equal(toReader(db,id.event,now+6)?.content.details.year,'-1');
});
test('TL-03: invalid provided event or period year is rejected before persistence',()=>{
 let db=newLibrary();
 db=createNode(db,{id:id.series,kind:'series',content:content('世界'),now});
 for(const bad of ['1.5','9e4','9007199254740992','not-year']){
   assert.throws(()=>createNode(db,{id:id.period,kind:'periodization',parentId:id.series,
     content:content('暦',{relativeYears:bad}),now}),e=>e?.code==='bad-request',bad);
 }
 db=createNode(db,{id:id.period,kind:'periodization',parentId:id.series,content:content('暦'),now});
 db=createNode(db,{id:id.event,kind:'event',parentId:id.period,content:content('初期',{year:'0'}),now});
 const before=db.nodes.find(n=>n.id===id.event);
 for(const bad of ['0.5','1e2','1 2','-9007199254740992']){
   assert.throws(()=>editNode(db,id.event,before.revision,content('変更',{year:bad}),now+1),
     e=>e?.code==='bad-request',bad);
 }
 assert.equal(db.nodes.find(n=>n.id===id.event).draft.details.year,'0');
 assert.equal(db.nodes.find(n=>n.id===id.event).revision,before.revision);
});
test('TL-03: within-period chronology orders negative, zero and positive years',()=>{
 const event=(id,year,order)=>({id,order,content:{title:id,details:{year}}});
 const list=[event('future','100',0),event('zero','0',0),event('past','-100',0)];
 assert.deepEqual(list.sort(compareEventsWithinPeriod).map(e=>e.id),['past','zero','future']);
});
