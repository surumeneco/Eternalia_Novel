// Exploratory integration evidence, NOT CAT normative gate closure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createNode, editNode, publishNode, setVisibility, publicSeries, toReader } from '@eternalia/contracts';

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
