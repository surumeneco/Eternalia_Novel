import { test } from 'node:test';
import assert from 'node:assert/strict';
import {newLibrary,createNode,editNode,publishNode,publicTree,setVisibility,softDeleteNode} from '../dist/novel.js';
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const content=title=>({title,body:'',details:{}});
const create=(db,n,kind,parent,title)=>createNode(db,{id:id(n),kind,parentId:parent,content:content(title),now:10});
const pub=(db,n)=>publishNode(db,id(n),db.nodes.find(x=>x.id===id(n)).revision,20);
const edit=(db,n,title)=>editNode(db,id(n),db.nodes.find(x=>x.id===id(n)).revision,content(title),30);
const reject=(action,existing)=>assert.throws(action,e=>e?.code==='duplicate-spelling'&&e?.existingWordId===existing);
function base(){let db=newLibrary();db=create(db,1,'series',null,'S');db=pub(db,1);db=create(db,2,'language',id(1),'L');db=pub(db,2);db=create(db,3,'word',id(2),'X');db=pub(db,3);return db}
test('a published word X reserves X even after its draft alone is renamed Y',()=>{
 let db=base();db=edit(db,3,'Y');const before=structuredClone(db);
 reject(()=>create(db,4,'word',id(2),'X'),id(3));assert.deepEqual(db,before);
 const visible=publicTree(db,id(1),100).filter(x=>x.kind==='word');assert.equal(visible.length,1);assert.equal(visible[0].content.title,'X');
});
test('both the edited draft spelling Y and still-published X remain reserved',()=>{
 let db=base();db=edit(db,3,'Y');reject(()=>create(db,4,'word',id(2),'Y'),id(3));reject(()=>create(db,5,'word',id(2),'X'),id(3));
});
test('existing word rename into a prior published X is rejected without side effects',()=>{
 let db=base();db=create(db,4,'word',id(2),'Z');db=edit(db,3,'Y');const before=structuredClone(db);
 reject(()=>edit(db,4,'X'),id(3));assert.deepEqual(db,before);
});
test('after explicitly publishing Y, old published spelling X is released',()=>{
 let db=base();db=edit(db,3,'Y');db=pub(db,3);db=create(db,4,'word',id(2),'X');db=pub(db,4);
 const words=publicTree(db,id(1),100).filter(x=>x.kind==='word');assert.deepEqual(words.map(x=>x.content.title).sort(),['X','Y']);
});
test('different language may register X even while first language publishes X',()=>{
 let db=base();db=edit(db,3,'Y');db=create(db,4,'language',id(1),'Other');db=pub(db,4);db=create(db,5,'word',id(4),'X');db=pub(db,5);
 const words=publicTree(db,id(1),100).filter(x=>x.kind==='word');assert.equal(words.length,2);assert.equal(words.filter(x=>x.content.title==='X').length,2);
});
test('a still-retained published snapshot reserves spelling even if visibility is private',()=>{
 let db=base();db=edit(db,3,'Y');db=setVisibility(db,id(3),db.nodes.find(x=>x.id===id(3)).revision,false,null,40);
 const before=structuredClone(db);reject(()=>create(db,4,'word',id(2),'X'),id(3));assert.deepEqual(db,before);
});
test('soft deletion of the private word releases both draft and old published spellings',()=>{
 let db=base();db=edit(db,3,'Y');db=setVisibility(db,id(3),db.nodes.find(x=>x.id===id(3)).revision,false,null,40);
 db=softDeleteNode(db,id(3),db.nodes.find(x=>x.id===id(3)).revision,50);
 db=create(db,4,'word',id(2),'X');db=pub(db,4);
 assert.equal(publicTree(db,id(1),100).filter(x=>x.kind==='word'&&x.content.title==='X').length,1);
});
test('re-editing its own draft spelling does not falsely conflict with its public snapshot',()=>{
 let db=base();db=edit(db,3,'Y');db=edit(db,3,'X');assert.equal(db.nodes.find(x=>x.id===id(3)).draft.title,'X');
});
