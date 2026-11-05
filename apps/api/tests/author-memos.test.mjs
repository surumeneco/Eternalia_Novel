// Exploratory tests; not CAT normative TestModel or generated Green evidence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('reflect-metadata');
const { AuthorMemosService, validateMemo } = require('../dist/author-memos.service.js');

test('memo validation rejects malformed tags and oversized inputs', () => {
  assert.deepEqual(validateMemo({title:' 資料 ',body:'本文',tags:['用語']}),{
    title:'資料',body:'本文',tags:['用語'],
  });
  assert.throws(() => validateMemo({title:'資料',body:'',tags:['重複','重複']}));
  assert.throws(() => validateMemo({title:'',body:'',tags:[]}));
  assert.throws(() => validateMemo({title:'資料',body:'',tags:['X'.repeat(51)]}));
});

test('author notes remain persisted and revision conflicts reject stale writes', async () => {
  assert.ok(process.env.DATABASE_URL,'DATABASE_URL must be set');
  const memos = new AuthorMemosService();
  try {
    const title = 'memo-' + crypto.randomUUID();
    const created = await memos.create({title,body:'初稿',tags:['資料']});
    assert.equal(created.revision,1);
    const saved = (await memos.list()).find(item => item.id === created.id);
    assert.equal(saved?.body,'初稿');
    assert.deepEqual(saved?.tags,['資料']);
    const edited = await memos.edit(created.id,1,{title,body:'改訂版',tags:['語彙']});
    assert.equal(edited.revision,2);
    assert.deepEqual((await memos.list()).find(item => item.id === created.id)?.tags,['語彙']);
    await assert.rejects(memos.edit(created.id,1,{title,body:'競合',tags:[]}),
      error => error?.getStatus?.() === 409);
  } finally {
    await memos.onModuleDestroy();
  }
});
