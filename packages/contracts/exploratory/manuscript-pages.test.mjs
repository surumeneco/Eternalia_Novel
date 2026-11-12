import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNode, editNode, publishNode, setVisibility, newLibrary, toReader,
  pagesForChapter,
} from '../dist/index.js';

const ids = {
  series: '11111111-1111-4111-8111-111111111111',
  volume: '22222222-2222-4222-8222-222222222222',
  part: '33333333-3333-4333-8333-333333333333',
  chapter: '44444444-4444-4444-8444-444444444444',
};
const now = 1_800_000_000_000;
const content = (title, body, extra = {}) => ({ title, body, details: {}, ...extra });
const setup = () => {
  let db = newLibrary();
  let parentId = null;
  for (const kind of ['series','volume','part','chapter']) {
    db = createNode(db, { id: ids[kind], kind, parentId, content:content(kind,''), now });
    parentId = ids[kind];
  }
  return db;
};

const publishAncestry = db => {
  for (const kind of ['series','volume','part','chapter']) {
    const id=ids[kind];
    let node=db.nodes.find(n=>n.id===id);
    db=publishNode(db,id,node.revision,now+1);
    node=db.nodes.find(n=>n.id===id);
    db=setVisibility(db,id,node.revision,true,now+1,now+1);
  }
  return db;
};

test('AC-03/33/57: canonical pages are ordered, persist, publish and stay independent of later drafts', () => {
  let db=setup();
  const id=ids.chapter;
  db=editNode(db,id,1,content('章','stale legacy', { pages:['はじめ｜漢字《かんじ》','途中の挿入','おわり']}),now+2);
  let draft=db.nodes.find(n=>n.id===id).draft;
  assert.deepEqual(draft.pages,['はじめ｜漢字《かんじ》','途中の挿入','おわり']);
  assert.equal(draft.body,'はじめ｜漢字《かんじ》[[page]]途中の挿入[[page]]おわり');
  db=publishAncestry(db);
  assert.deepEqual(toReader(db,id,now+3)?.content.pages, ['はじめ｜漢字《かんじ》','途中の挿入','おわり']);
  const rev=db.nodes.find(n=>n.id===id).revision;
  db=editNode(db,id,rev,content('章','', {pages:['おわり','新規挿入','はじめ｜漢字《かんじ》','途中の挿入']}),now+4);
  assert.deepEqual(db.nodes.find(n=>n.id===id).draft.pages,['おわり','新規挿入','はじめ｜漢字《かんじ》','途中の挿入']);
  assert.deepEqual(toReader(db,id,now+5)?.content.pages,['はじめ｜漢字《かんじ》','途中の挿入','おわり'], 'draft must not leak to anonymous reader');
  db=publishNode(db,id,db.nodes.find(n=>n.id===id).revision,now+6);
  assert.deepEqual(toReader(db,id,now+7)?.content.pages,['おわり','新規挿入','はじめ｜漢字《かんじ》','途中の挿入']);
});

test('legacy string markers migrate to a page array when a chapter is edited', () => {
  const db=setup();
  const original=db.nodes.find(n=>n.id===ids.chapter);
  const next=editNode(db,ids.chapter,original.revision,content('章','一頁[[page]]二頁'),now+1);
  assert.deepEqual(next.nodes.find(n=>n.id===ids.chapter).draft.pages,['一頁','二頁']);
  assert.deepEqual(pagesForChapter({body:'旧頁1[[page]]旧頁2'}),['旧頁1','旧頁2']);
  assert.deepEqual(pagesForChapter({body:'古い値',pages:['正本の1','正本の2']}),['正本の1','正本の2']);
});

test('malformed pages are rejected without mutating prior state', () => {
  const db=setup();
  const entry=db.nodes.find(n=>n.id===ids.chapter);
  for (const pages of [[],[1],null,new Array(1001).fill(''),['a'.repeat(100001)]]) {
    assert.throws(() => editNode(db,ids.chapter,entry.revision,content('章','',{pages}),now+1), error => error?.code === 'bad-request');
  }
  assert.equal(db.nodes.find(n=>n.id===ids.chapter).revision,1);
  assert.throws(() => editNode(db,ids.part,1,content('部','', {pages:['不正']}),now+1));
});
