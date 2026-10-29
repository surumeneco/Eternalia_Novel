// Exploratory public ancestry coverage. CAT model evidence remains independent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { newLibrary,createNode,publishNode,editNode,setVisibility,publicPath } from '../dist/index.js';
const now=Date.UTC(2026,9,29);
function create(db,kind,parentId,title){
 const id=randomUUID();return {id,db:createNode(db,{id,kind,parentId,content:{title,body:'',details:{}},now})};
}
test('published chapter ancestry allows correct series navigation without query parameters',()=>{
 let db=newLibrary();
 const s=create(db,'series',null,'world');db=s.db;
 const v=create(db,'volume',s.id,'book');db=v.db;
 const p=create(db,'part',v.id,'part');db=p.db;
 const c=create(db,'chapter',p.id,'chapter');db=c.db;
 for(const id of [s.id,v.id,p.id,c.id]) db=publishNode(db,id,1,now);
 const path=publicPath(db,c.id,now+1);
 assert.deepEqual(path.map(n=>n.kind),['series','volume','part','chapter']);
 assert.equal(path[0].id,s.id);
 db=editNode(db,v.id,1,{title:'secret-draft',body:'',details:{}},now+2);
 assert.equal(publicPath(db,c.id,now+3)[1].content.title,'book','draft parent title not leaked');
 db=setVisibility(db,v.id,2,false,null,now+4);
 assert.deepEqual(publicPath(db,c.id,now+5),[],'hidden parent blocks every segment');
 assert.deepEqual(publicPath(db,randomUUID(),now+5),[],'missing IDs are not disclosed');
});
test('future-dated ancestor never returns a partial public breadcrumb',()=>{
 let db=newLibrary();const s=create(db,'series',null,'world');db=s.db;
 const child=create(db,'category',s.id,'private');db=child.db;
 for(const id of [s.id,child.id])db=publishNode(db,id,1,now);
 db=setVisibility(db,s.id,1,true,now+60000,now);
 assert.deepEqual(publicPath(db,child.id,now+59999),[]);
 assert.equal(publicPath(db,child.id,now+60000).length,2);
});
