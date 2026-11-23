import test from 'node:test';
import assert from 'node:assert/strict';
import { publicNodeRoute, publicAreaRoute, belongsToPublicSeries } from '../app/utils/public-node-route.ts';
const node=(id,kind,parentId=null)=>({id,kind,parentId,order:0,content:{title:id,body:'',details:{}},publishedAt:0});
const tree=[node('s','series'),node('v','volume','s'),node('p','part','v'),node('c','chapter','p'),
 node('cat','category','s'),node('tip','tip','cat'),node('sec','tipSection','tip'),node('lang','language','s'),
 node('word','word','lang'),node('gram','grammar','lang'),node('period','periodization','s'),node('event','event','period')];
test('reader paths reflect the full published domain ancestry',()=>{
 const expected={s:'/series/s',v:'/series/s/stories/v',p:'/series/s/stories/v/parts/p',c:'/series/s/stories/v/parts/p/chapters/c',
 cat:'/series/s/settings/cat',tip:'/series/s/settings/cat/tip',sec:'/series/s/settings/cat/tip/sections/sec',
 lang:'/series/s/dictionaries/lang',word:'/series/s/dictionaries/lang/words/word',gram:'/series/s/dictionaries/lang/grammar/gram',
 period:'/series/s/timeline/periods/period',event:'/series/s/timeline/periods/period/events/event'};
 for(const [id,path] of Object.entries(expected)) assert.equal(publicNodeRoute(tree,id),path);
});
test('never create a canonical route for an orphan or invalid domain parent',()=>{
 assert.equal(publicNodeRoute([...tree,node('other','series'),node('bad','chapter','other')],'bad'),null);
 assert.equal(publicNodeRoute([...tree,node('stray','tip','s')],'stray'),null);
 assert.equal(publicNodeRoute([...tree,node('missing','word','absent')],'missing'),null);
 assert.equal(belongsToPublicSeries(tree,'tip','other'),false);
 assert.equal(belongsToPublicSeries(tree,'tip','s','tip'),true);
 assert.equal(publicAreaRoute('x y','settings'),'/series/x%20y/settings');
});
