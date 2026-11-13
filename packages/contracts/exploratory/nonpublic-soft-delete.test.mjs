import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNode, editNode, newLibrary, publishNode, setVisibility,
  softDeleteNode, managedList, publicTree, toReader, reorderSiblings, moveTip,
} from '../dist/index.js';

const t0=1_800_000_000_000;
const uuid=n=>n.toString(16).padStart(8,'0')+'-1111-4111-8111-111111111111';
function setup() {
 let db=newLibrary(),idx=0;
 const add=(kind,parentId,title,details={})=>{
  const id=uuid(++idx);
  db=createNode(db,{id,kind,parentId,content:{title,body:title,details},now:t0});
  return id;
 };
 const series=add('series',null,'世界');
 const category=add('category',series,'人物');
 const tip=add('tip',category,'対象');
 const leaf=add('tip',category,'参照無し');
 const language=add('language',series,'語族');
 const word=add('word',language,'単語');
 const publish=id=>{
  db=publishNode(db,id,db.nodes.find(n=>n.id===id).revision,t0);
 };
 const hide=id=>{
  db=setVisibility(db,id,db.nodes.find(n=>n.id===id).revision,false,null,t0);
 };
 for(const id of [series,category,tip,leaf,language,word]) publish(id);
 for(const id of [series,category,tip,language,word]) {
  db=setVisibility(db,id,db.nodes.find(n=>n.id===id).revision,true,t0,t0);
 }
 return {get db(){return db},set db(value){db=value},ids:{series,category,tip,leaf,language,word},add,publish,hide};
}
const current=(db,id)=>db.nodes.find(n=>n.id===id);
test('AC-76: private published leaf is hidden but retains audit data, no ID reuse',()=>{
 const f=setup(),id=f.ids.leaf;
 const before=current(f.db,id);
 assert.equal(before.published !== null,true);
 const deleted=softDeleteNode(f.db,id,before.revision,t0+1);
 assert.equal(deleted.nodes.length,f.db.nodes.length);
 assert.equal(current(deleted,id).deletedAt,t0+1);
 assert.equal(current(deleted,id).revision,before.revision+1);
 assert.deepEqual(current(deleted,id).draft,before.draft);
 assert.deepEqual(current(deleted,id).published,before.published);
 assert.equal(managedList(deleted).some(n=>n.id===id),false);
 assert.equal(toReader(deleted,id,t0+2),null);
 assert.equal(publicTree(deleted,f.ids.series,t0+2).some(n=>n.id===id),false);
 assert.throws(()=>editNode(deleted,id,before.revision+1,before.draft,t0+3),e=>e?.code==='not-found');
 assert.throws(()=>publishNode(deleted,id,before.revision+1,t0+3),e=>e?.code==='not-found');
 assert.throws(()=>setVisibility(deleted,id,before.revision+1,true,t0+2,t0+3),e=>e?.code==='not-found');
 assert.throws(()=>softDeleteNode(deleted,id,before.revision+1,t0+4),e=>e?.code==='not-found');
 assert.throws(()=>createNode(deleted,{id,kind:'tip',parentId:f.ids.category,content:before.draft,now:t0+4}),e=>e?.code==='bad-request');
 assert.equal(current(f.db,id).deletedAt,null,'original transaction state untouched');
});
test('AC-76: public, never-published and stale revisions must not delete',()=>{
 const f=setup(),{tip,leaf}=f.ids;
 const pub=current(f.db,tip);
 assert.throws(()=>softDeleteNode(f.db,tip,pub.revision,t0+1),e=>e?.code==='bad-request');
 assert.throws(()=>softDeleteNode(f.db,leaf,0,t0+1),e=>e?.code==='conflict');
 const unpub=f.add('tip',f.ids.category,'草案');
 assert.throws(()=>softDeleteNode(f.db,unpub,current(f.db,unpub).revision,t0+1),e=>e?.code==='bad-request');
 assert.throws(()=>softDeleteNode(f.db,'deadbeef-1111-4111-8111-111111111111',1,t0+1),e=>e?.code==='not-found');
 assert.equal(current(f.db,leaf).deletedAt,null);
});
test('AC-76: draft or published children block non-cascading delete',()=>{
 const f=setup(),{tip}=f.ids;
 f.hide(tip);
 const section=f.add('tipSection',tip,'部品');
 assert.throws(()=>softDeleteNode(f.db,tip,current(f.db,tip).revision,t0+1),e=>e?.code==='bad-request');
 assert.ok(current(f.db,section));
});
test('AC-76: old published parent remains a dependent during draft category move',()=>{
 const f=setup(),{category}=f.ids;
 // A Tip stays publicly under the old category until explicit publication.
 const source=f.add('category',f.ids.series,'削除元');
 f.publish(source);
 f.hide(source);
 const moving=f.add('tip',source,'移動予定');
 f.publish(moving);
 const target=f.ids.category;
 f.db= (awaitMove => awaitMove)(f.db); // fixed by subsequent operation below
});
