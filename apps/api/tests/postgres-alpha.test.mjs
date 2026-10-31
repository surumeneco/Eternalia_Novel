// Exploratory integration evidence, NOT CAT normative gate closure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createNode, editNode, publishNode, setVisibility, publicSeries, publicTree, toReader, reorderSiblings } from '@eternalia/contracts';

const require = createRequire(import.meta.url);
require('reflect-metadata');
const { PostgresLibraryService } = require('../dist/postgres-library.service.js');

test('PostgreSQL persists draft and independent published snapshot across reads', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL required; run migrations first');
  const repository = new PostgresLibraryService();
  const id = randomUUID();
  const now = Date.UTC(2026, 9, 29);
  try {
    await repository.mutate(db => createNode(db, {
      id, kind:'series', content:{title:'初稿',body:'最初の内容',details:{}}, now,
    }));
    assert.equal((await repository.read()).nodes.find(n => n.id === id)?.draft.title,'初稿');
    assert.equal(publicSeries(await repository.read(),now+1).find(n => n.id === id),undefined);

    await repository.mutate(db => publishNode(db,id,1,now));
    assert.equal(publicSeries(await repository.read(),now+1).find(n => n.id === id)?.content.title,'初稿');

    await repository.mutate(db => editNode(db,id,1,{
      title:'第二稿',body:'公開前の新しい下書き',details:{},
    },now+1000));
    const second = await repository.read();
    assert.equal(second.nodes.find(n => n.id === id)?.draft.title,'第二稿');
    assert.equal(toReader(second,id,now+2000)?.content.title,'初稿','draft must not leak');

    await repository.mutate(db => publishNode(db,id,2,now+2000));
    assert.equal(toReader(await repository.read(),id,now+3000)?.content.title,'第二稿');

    await repository.mutate(db => setVisibility(db,id,2,false,null,now+3000));
    assert.equal(toReader(await repository.read(),id,now+4000),null,'non-public must be hidden');

    await assert.rejects(
      repository.mutate(db => editNode(db,id,1,{title:'古い版',body:'',details:{}},now+5000)),
      err => err?.code === 'conflict',
    );
  } finally {
    await repository.onModuleDestroy();
  }
});

test('PostgreSQL advisory lock serializes competing edits of the same draft', async () => {
  const repository = new PostgresLibraryService();
  const id = randomUUID(), now = Date.UTC(2026,9,29);
  try {
    await repository.mutate(db => createNode(db,{
      id,kind:'series',content:{title:'同時編集',body:'',details:{}},now,
    }));
    const results = await Promise.allSettled([
      repository.mutate(db => editNode(db,id,1,{title:'A',body:'',details:{}},now+1)),
      repository.mutate(db => editNode(db,id,1,{title:'B',body:'',details:{}},now+2)),
    ]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length,1);
    assert.equal(results.filter(r => r.status === 'rejected' && r.reason?.code === 'conflict').length,1);
  } finally {
    await repository.onModuleDestroy();
  }
});

test('PostgreSQL preserves separate word senses and hides unpublished etymology source references', async () => {
  const repository = new PostgresLibraryService();
  const seriesId=randomUUID(), sourceLanguageId=randomUUID(), targetLanguageId=randomUUID();
  const sourceWordId=randomUUID(), targetWordId=randomUUID();
  const senseA=randomUUID(), senseB=randomUUID();
  const now=Date.UTC(2026,9,29);
  const data = title => ({title,body:'',details:{}});
  const meanings=[
    {id:senseA,partOfSpeech:'名詞',definition:'第1義',etymologies:[
      {id:randomUUID(),languageId:sourceLanguageId,wordId:sourceWordId,note:'元の語'},
    ]},
    {id:senseB,partOfSpeech:'名詞',definition:'第2義',etymologies:[]},
  ];
  try {
    for(const [id,kind,parentId,title,details] of [
      [seriesId,'series',null,'保存テスト',{}],
      [sourceLanguageId,'language',seriesId,'原語',{}],
      [targetLanguageId,'language',seriesId,'対象語',{}],
      [sourceWordId,'word',sourceLanguageId,'原形',{}],
      [targetWordId,'word',targetLanguageId,'新語',{meanings:JSON.stringify(meanings)}],
    ]) {
      await repository.mutate(db => createNode(db,{
        id,kind,parentId,content:{...data(title),details},now,
      }));
    }
    for(const id of [seriesId,sourceLanguageId,targetLanguageId,sourceWordId,targetWordId]) {
      await repository.mutate(db => {
        const revision=db.nodes.find(node=>node.id===id).revision;
        return publishNode(db,id,revision,now);
      });
    }
    const initial=toReader(await repository.read(),targetWordId,now+1);
    assert.equal(JSON.parse(initial.content.details.meanings).length,2);
    const source=JSON.parse(initial.content.details.meanings)[0].etymologies[0];
    assert.equal(source.wordTitle,'原形');
    await repository.mutate(db => setVisibility(
      db,sourceWordId,db.nodes.find(node=>node.id===sourceWordId).revision,false,null,now+2,
    ));
    const hidden=JSON.parse(toReader(await repository.read(),targetWordId,now+3).content.details.meanings);
    assert.equal(hidden[0].etymologies[0].wordId,undefined);
    assert.equal(hidden[0].etymologies[0].wordTitle,undefined);
  } finally {
    await repository.onModuleDestroy();
  }
});

test('PostgreSQL persists explicitly reordered sibling order and detects stale batch revision', async () => {
  const repository=new PostgresLibraryService();
  const seriesId=randomUUID(),a=randomUUID(),b=randomUUID(),now=Date.UTC(2026,9,29);
  try {
    await repository.mutate(db=>{
      let next=createNode(db,{id:seriesId,kind:'series',content:{title:'order-series',body:'',details:{}},now});
      for(const [id,title] of [[a,'A'],[b,'B']]) next=createNode(next,{
        id,kind:'volume',parentId:seriesId,content:{title,body:'',details:{}},now,
      });
      for(const id of [seriesId,a,b]) next=publishNode(next,id,1,now);
      return next;
    });
    await repository.mutate(db=>reorderSiblings(db,{
      parentId:seriesId,kind:'volume',orderedIds:[b,a],
      expectedRevisions:{[a]:1,[b]:1},
    },now+1));
    const loaded=await repository.read();
    assert.deepEqual(publicTree(loaded,seriesId,now+2).filter(n=>n.kind==='volume')
      .map(n=>n.id),[b,a]);
    await assert.rejects(repository.mutate(db=>reorderSiblings(db,{
      parentId:seriesId,kind:'volume',orderedIds:[a,b],
      expectedRevisions:{[a]:1,[b]:1},
    },now+2)),e=>e.code==='conflict');
  } finally { await repository.onModuleDestroy(); }
});
