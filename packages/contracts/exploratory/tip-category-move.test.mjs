import test from 'node:test';
import assert from 'node:assert/strict';
import { newLibrary, createNode, publishNode, moveTip, publicTree, publicPath, toReader } from '../dist/index.js';

const now=1_800_000_000_000;
const id={
  s:'11111111-1111-4111-8111-111111111111',
  s2:'22222222-2222-4222-8222-222222222222',
  a:'33333333-3333-4333-8333-333333333333',
  b:'44444444-4444-4444-8444-444444444444',
  other:'55555555-5555-4555-8555-555555555555',
  tip:'66666666-6666-4666-8666-666666666666',
  section:'77777777-7777-4777-8777-777777777777',
};
function setup() {
 let db=newLibrary();
 const add=(uid,kind,parentId,details={})=>{
  db=createNode(db,{id:uid,kind,parentId,content:{title:kind+uid.slice(0,4),body:'本文',details},now});
 };
 add(id.s,'series',null);
 add(id.s2,'series',null);
 add(id.a,'category',id.s);
 add(id.b,'category',id.s,{presets:'[{"title":"新雛形","body":"無断伝播しない"}]'});
 add(id.other,'category',id.s2);
 add(id.tip,'tip',id.a,{tags:'["人物"]'});
 add(id.section,'tipSection',id.tip);
 for(const uid of [id.s,id.a,id.b,id.tip,id.section]) {
  const rev=db.nodes.find(n=>n.id===uid).revision;
  db=publishNode(db,uid,rev,now);
 }
 return db;
}
test('AC-46: draft move retains published old ancestry, linked content and IDs until publish',()=>{
 const original=setup();
 const oldTip=original.nodes.find(n=>n.id===id.tip);
 const oldSection=original.nodes.find(n=>n.id===id.section);
 const moved=moveTip(original,id.tip,oldTip.revision,id.b,now+1);
 const tip=moved.nodes.find(n=>n.id===id.tip);
 assert.equal(original.nodes.find(n=>n.id===id.tip).parentId,id.a);
 assert.equal(tip.parentId,id.b);
 assert.equal(tip.revision,oldTip.revision+1);
 assert.deepEqual(tip.draft,oldTip.draft);
 assert.deepEqual(tip.published,oldTip.published);
 assert.deepEqual(moved.nodes.find(n=>n.id===id.section),oldSection);
 assert.equal(moved.nodes.filter(n=>n.kind==='tipSection').length,1,'new presets not copied');
 assert.equal(publicTree(moved,id.s,now+2).find(n=>n.id===id.tip)?.parentId,id.a);
 assert.deepEqual(publicPath(moved,id.tip,now+2).map(n=>n.id),[id.s,id.a,id.tip]);
 const pub=publishNode(moved,id.tip,tip.revision,now+3);
 assert.equal(toReader(pub,id.tip,now+4)?.parentId,id.b);
 assert.deepEqual(publicPath(pub,id.tip,now+4).map(n=>n.id),[id.s,id.b,id.tip]);
 assert.equal(publicTree(pub,id.s,now+4).find(n=>n.id===id.tip)?.parentId,id.b);
 assert.equal(toReader(pub,id.section,now+4)?.parentId,id.tip);
});
test('AC-46: stale revisions, cross-world and invalid types are rejected without mutation',()=>{
 const db=setup(), tip=db.nodes.find(n=>n.id===id.tip);
 const move=(rev,target)=>moveTip(db,id.tip,rev,target,now+1);
 assert.throws(()=>move(tip.revision-1,id.b),e=>e?.code==='conflict');
 for(const target of [id.a,id.other,id.s,id.s2,id.tip,'missing',null]) {
  assert.throws(()=>move(tip.revision,target),e=>e?.code==='bad-request'||e?.code==='not-found');
 }
 assert.throws(()=>moveTip(db,id.section,1,id.b,now+1),e=>e?.code==='bad-request');
 assert.deepEqual(db.nodes.find(n=>n.id===id.tip),tip);
});

test('AC-46: draft move does not reorder old published list; explicit publish appends in destination',()=>{
 const targetTip='88888888-8888-4888-8888-888888888888';
 let db=setup();
 db=createNode(db,{id:targetTip,kind:'tip',parentId:id.b,content:{title:'別の設定',body:'既存の本文',details:{}},now});
 db=publishNode(db,targetTip,db.nodes.find(n=>n.id===targetTip).revision,now);
 const previous=db.nodes.find(n=>n.id===id.tip);
 db=moveTip(db,id.tip,previous.revision,id.b,now+1);
 assert.equal(db.nodes.find(n=>n.id===id.tip).order,previous.order);
 assert.equal(publicTree(db,id.s,now+2).find(n=>n.id===id.tip).order,previous.order);
 db=publishNode(db,id.tip,db.nodes.find(n=>n.id===id.tip).revision,now+3);
 assert.equal(toReader(db,id.tip,now+4).order,1);
 assert.equal(toReader(db,targetTip,now+4).order,0);
});
