// Exploratory tests; not CAT normative TestModel or generated Green evidence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('reflect-metadata');
const { AuthorMemosService, validateMemo } = require('../dist/author-memos.service.js');
const { CommonMastersService } = require('../dist/common-masters.service.js');
const { Pool } = require('pg');

test('memo validation requires distinct stable Tag IDs rather than legacy label strings', () => {
  const id = crypto.randomUUID();
  assert.deepEqual(validateMemo({title:' 資料 ',body:'本文',tags:[id]}),{
    title:'資料',body:'本文',tags:[id],
  });
  assert.throws(() => validateMemo({title:'資料',body:'',tags:[id,id]}));
  assert.throws(() => validateMemo({title:'資料',body:'',tags:['旧タグ名']}));
  assert.throws(() => validateMemo({title:'',body:'',tags:[]}));
  assert.throws(() => validateMemo({title:'資料',body:'',tags:['X'.repeat(51)]}));
});

test('author notes remain persisted and revision conflicts reject stale writes', async () => {
  assert.ok(process.env.DATABASE_URL,'DATABASE_URL must be set');
  const memos = new AuthorMemosService();
  const masters = new CommonMastersService();
  const db = new Pool({connectionString:process.env.DATABASE_URL});
  const group = 'memo-test-' + crypto.randomUUID();
  let first, second, created;
  try {
    first = await masters.create('tags',{group,name:'資料',order:0});
    second = await masters.create('tags',{group,name:'語彙',order:1});
    const title = 'memo-' + crypto.randomUUID();
    await assert.rejects(
      memos.create({title,body:'reject-unknown-tag',tags:[crypto.randomUUID()]}),
      error => error?.getStatus?.() === 400,
      'memo cannot attach unregistered Tag UUIDs');
    created = await memos.create({title,body:'初稿',tags:[first.id]});
    assert.equal(created.revision,1);
    const saved = (await memos.list()).find(item => item.id === created.id);
    assert.equal(saved?.body,'初稿');
    assert.deepEqual(saved?.tags,[first.id]);
    const edited = await memos.edit(created.id,1,{title,body:'改訂版',tags:[second.id]});
    assert.equal(edited.revision,2);
    assert.deepEqual((await memos.list()).find(item => item.id === created.id)?.tags,[second.id]);
    await assert.rejects(memos.edit(created.id,1,{title,body:'競合',tags:[]}),
      error => error?.getStatus?.() === 409);
  } finally {
    if (created) await db.query('DELETE FROM author_memos WHERE id=$1',[created.id]);
    for (const tag of [first,second].filter(Boolean)) {
      await masters.remove('tags',tag.id,tag.revision);
    }
    await db.end();
    await masters.onModuleDestroy();
    await memos.onModuleDestroy();
  }
});
