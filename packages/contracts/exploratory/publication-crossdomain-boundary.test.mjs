import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  createNode, editNode, newLibrary, publishNode, publicRecent, publicTree,
  setVisibility, toReader,
} from '../dist/index.js';

const boundary = Date.parse('2031-02-03T00:15:00.000Z');
const created = boundary - 60_000;
const text = title => ({title,body:'published:'+title,details:{}});
function fixture(){
 let db=newLibrary();
 const ids={};
 const add=(name,kind,parentName)=>{
  ids[name]=randomUUID();
  db=createNode(db,{id:ids[name],kind,parentId:parentName?ids[parentName]:null,content:text(name),now:created});
 };
 add('series','series');
 add('volume','volume','series');add('part','part','volume');add('chapter','chapter','part');
 add('category','category','series');add('tip','tip','category');
 add('language','language','series');add('word','word','language');
 add('period','periodization','series');add('event','event','period');
 for(const id of Object.values(ids))db=publishNode(db,id,1,created);
 const schedule=(name,instant)=>{
  const node=db.nodes.find(x=>x.id===ids[name]);
  db=setVisibility(db,ids[name],node.revision,true,instant,created);
 };
 return {get db(){return db},ids,schedule,edit(name,body){
  const node=db.nodes.find(x=>x.id===ids[name]);
  db=editNode(db,ids[name],node.revision,{...node.draft,body},created);
 }};
}
const readerIds=(db,seriesId,at)=>new Set(publicTree(db,seriesId,at).map(x=>x.id));
const recentIds=(db,at)=>new Set(publicRecent(db,at).map(x=>x.id));

test('PB-05/AC-45/54: exact millisecond visibility boundary in all four public domains',()=>{
 const f=fixture();
 const ids=[f.ids.chapter,f.ids.tip,f.ids.word,f.ids.event];
 for(const name of ['chapter','tip','word','event'])f.schedule(name,boundary);
 for(const at of [boundary-1,boundary,boundary+1]){
  const visible=at>=boundary;
  const tree=readerIds(f.db,f.ids.series,at);
  const recent=recentIds(f.db,at);
  for(const id of ids){
   assert.equal(toReader(f.db,id,at)!==null,visible,'item: '+id+' at '+at);
   assert.equal(tree.has(id),visible,'tree: '+id+' at '+at);
   assert.equal(recent.has(id),visible,'recent: '+id+' at '+at);
  }
 }
});
test('PB-05/AC-70: one future-dated ancestor blocks descendants at equality of their own start',()=>{
 const f=fixture();
 f.schedule('event',boundary);
 f.schedule('period',boundary+1);
 for(const at of [boundary-1,boundary]){
  assert.equal(toReader(f.db,f.ids.event,at),null);
  assert.equal(readerIds(f.db,f.ids.series,at).has(f.ids.event),false);
  assert.equal(recentIds(f.db,at).has(f.ids.event),false);
 }
 assert.equal(toReader(f.db,f.ids.event,boundary+1)?.content.title,'event');
});
test('AC-69/70: a scheduled publication reveals only the last explicitly published text',()=>{
 const f=fixture();
 f.schedule('chapter',boundary);
 f.edit('chapter','private draft never published');
 assert.equal(toReader(f.db,f.ids.chapter,boundary-1),null);
 const publicChapter=toReader(f.db,f.ids.chapter,boundary);
 assert.equal(publicChapter?.content.body,'published:chapter');
 assert.ok(!JSON.stringify(publicTree(f.db,f.ids.series,boundary)).includes('private draft never published'));
 assert.ok(!JSON.stringify(publicRecent(f.db,boundary)).includes('private draft never published'));
});
