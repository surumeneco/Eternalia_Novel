import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { Pool } = require('pg');
const { CommonMastersService, deleteAdmission } = require('../dist/common-masters.service.js');

test('CAT deletion admission distinguishes conflict, references, and valid deletion', () => {
  assert.equal(deleteAdmission(false,false),'conflict');
  assert.equal(deleteAdmission(false,true),'conflict');
  assert.equal(deleteAdmission(true,true),'referenced');
  assert.equal(deleteAdmission(true,false),'allowed');
});

test('site-wide Tag/Div masters support stable IDs, ordering, guarded CRUD, and reference protections', async () => {
  assert.ok(process.env.DATABASE_URL,'DATABASE_URL required');
  const svc = new CommonMastersService();
  const db = new Pool({connectionString:process.env.DATABASE_URL});
  const suffix = randomUUID();
  let tag, div;
  try {
    tag = await svc.create('tags',{group:'characters-'+suffix,name:'人物',order:3});
    div = await svc.create('classifications',{kind:'role-'+suffix,name:'役割',value:'writer',order:1});
    assert.match(tag.id,/^[0-9a-f-]{36}$/i);
    assert.notEqual(tag.id,div.id);
    assert.equal(tag.revision,1);
    assert.equal(div.value,'writer');
    assert.ok((await svc.list('tags')).some(row=>row.id===tag.id));
    assert.ok((await svc.list('classifications')).some(row=>row.id===div.id));
    await assert.rejects(svc.create('tags',{group:tag.group,name:tag.name,order:3}),e=>e.status===409);
    await assert.rejects(svc.edit('tags',tag.id,{group:tag.group,name:'改名',order:3,expectedRevision:7}),e=>e.status===409);
    div=await svc.edit('classifications',div.id,{kind:div.kind,name:'役割',value:'author',order:0,expectedRevision:div.revision});
    assert.equal(div.revision,2);
    assert.equal(div.value,'author');
    const memoId=randomUUID();
    await db.query('INSERT INTO author_memos(id,title,tags) VALUES($1,$2,$3::jsonb)',[
      memoId,'master-catalog-test-'+suffix,JSON.stringify([tag.id]),
    ]);
    await assert.rejects(svc.remove('tags',tag.id,tag.revision),e=>e.status===409,'in-use tag deletion refused');
    await assert.rejects(svc.edit('tags',tag.id,{group:tag.group,name:'改名',order:3,expectedRevision:tag.revision}),e=>e.status===409,'in-use tag rename refused');
    // PostgreSQL accepts upper-case UUID spelling as the same row identity.
    // JSONB reference membership must use that row's canonical ID.
    await assert.rejects(svc.edit('tags',tag.id.toUpperCase(),{
      group:tag.group,name:'別名',order:3,expectedRevision:tag.revision,
    }),e=>e.status===409,'upper-case UUID must not bypass referenced rename protection');
    await assert.rejects(svc.remove('tags',tag.id.toUpperCase(),tag.revision),
      e=>e.status===409,'upper-case UUID must not bypass referenced delete protection');
    assert.equal((await svc.list('tags')).find(row=>row.id===tag.id).name,tag.name);
    await db.query('DELETE FROM author_memos WHERE id=$1',[memoId]);
    tag=await svc.edit('tags',tag.id,{group:tag.group,name:'改名',order:0,expectedRevision:tag.revision});
    assert.equal(tag.revision,2);
    assert.equal(tag.order,0);
    await assert.rejects(svc.remove('tags',tag.id,1),e=>e.status===409,'stale delete refused');
    assert.deepEqual(await svc.remove('tags',tag.id,tag.revision),{ok:true});
    tag=null;
    assert.deepEqual(await svc.remove('classifications',div.id,div.revision),{ok:true});
    div=null;
  } finally {
    await db.query('DELETE FROM author_memos WHERE title=$1',['master-catalog-test-'+suffix]);
    if (tag) await db.query('DELETE FROM common_master_tags WHERE id=$1',[tag.id]);
    if (div) await db.query('DELETE FROM common_master_divisions WHERE id=$1',[div.id]);
    await db.end();
    await svc.onModuleDestroy();
  }
});
