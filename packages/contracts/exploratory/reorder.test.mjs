// Exploratory regression; canonical CAT TestModel and Gate are separate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { newLibrary, createNode, publishNode, reorderSiblings, publicTree } from '../dist/index.js';

const now=Date.UTC(2026,9,29);
function add(db,kind,parentId,title){
  const id=randomUUID();
  return {id,db:createNode(db,{id,kind,parentId,content:{title,body:'',details:{}},now})};
}
test('ordering changes only the requested sibling kind in one parent',()=>{
  let db=newLibrary();
  const s=add(db,'series',null,'world');db=s.db;
  const a=add(db,'volume',s.id,'A');db=a.db;
  const b=add(db,'volume',s.id,'B');db=b.db;
  const c=add(db,'volume',s.id,'C');db=c.db;
  const unrelated=add(db,'category',s.id,'independent');db=unrelated.db;
  for(const id of [s.id,a.id,b.id,c.id,unrelated.id]){
    db=publishNode(db,id,db.nodes.find(node=>node.id===id).revision,now);
  }
  const revisions=Object.fromEntries(db.nodes.map(node=>[node.id,node.revision]));
  db=reorderSiblings(db,{parentId:s.id,kind:'volume',
    orderedIds:[c.id,a.id,b.id],expectedRevisions:revisions},now+1);
  assert.deepEqual(publicTree(db,s.id,now+2).filter(node=>node.kind==='volume').map(node=>node.id),[c.id,a.id,b.id]);
  assert.equal(db.nodes.find(node=>node.id===unrelated.id).order,0);
  assert.equal(db.nodes.find(node=>node.id===unrelated.id).revision,1);
  assert.equal(db.nodes.find(node=>node.id===c.id).revision,2);
});
test('reorder rejects partial, duplicate, cross-parent and stale revision sets',()=>{
  let db=newLibrary();
  const s=add(db,'series',null,'world');db=s.db;
  const a=add(db,'volume',s.id,'A');db=a.db;
  const b=add(db,'volume',s.id,'B');db=b.db;
  const other=add(db,'series',null,'other');db=other.db;
  const foreign=add(db,'volume',other.id,'foreign');db=foreign.db;
  const rev=Object.fromEntries(db.nodes.map(node=>[node.id,node.revision]));
  const request=ids=>({parentId:s.id,kind:'volume',orderedIds:ids,expectedRevisions:rev});
  for(const ids of [[a.id],[a.id,a.id],[a.id,foreign.id]]) {
    assert.throws(()=>reorderSiblings(db,request(ids),now+1),e=>e.code==='bad-request');
  }
  assert.throws(()=>reorderSiblings(db,{...request([b.id,a.id]),
    expectedRevisions:{...rev,[b.id]:42}},now+1),e=>e.code==='conflict');
  const original=JSON.stringify(db);
  assert.equal(JSON.stringify(db),original);
});
test('ordering of unpublished work does not reveal its title via public readers',()=>{
  let db=newLibrary();
  const s=add(db,'series',null,'world');db=s.db;
  const a=add(db,'volume',s.id,'visible');db=a.db;
  const b=add(db,'volume',s.id,'private');db=b.db;
  for(const id of [s.id,a.id])db=publishNode(db,id,1,now);
  const rev=Object.fromEntries(db.nodes.map(node=>[node.id,node.revision]));
  db=reorderSiblings(db,{parentId:s.id,kind:'volume',
    orderedIds:[b.id,a.id],expectedRevisions:rev},now+1);
  assert.deepEqual(publicTree(db,s.id,now+2).filter(n=>n.kind==='volume').map(n=>n.id),[a.id]);
});
