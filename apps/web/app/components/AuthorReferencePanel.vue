<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
const props=defineProps<{ selectedId:string; nodes:AuthorNode[] }>();
const query=ref('');
const kindFilter=ref<'all'|'tip'|'word'|'grammar'>('all');
const highlightedId=ref('');
const byId=computed(()=>new Map(props.nodes.map(node=>[node.id,node])));
const seriesId=computed(()=>{
  let node=byId.value.get(props.selectedId);
  const seen=new Set<string>();
  while(node && !seen.has(node.id)) {
    if(node.kind==='series') return node.id;
    seen.add(node.id);
    node=node.parentId?byId.value.get(node.parentId):undefined;
  }
  return '';
});
const entries=computed(()=>props.nodes.filter(node=>{
  if(!seriesId.value || node.id===props.selectedId || !['tip','word','grammar'].includes(node.kind)) return false;
  if(kindFilter.value!=='all' && node.kind!==kindFilter.value) return false;
  let current:AuthorNode|undefined=node;
  const visited=new Set<string>();
  while(current && current.kind!=='series' && !visited.has(current.id)) {
    visited.add(current.id);
    current=current.parentId?byId.value.get(current.parentId):undefined;
  }
  if(current?.id!==seriesId.value) return false;
  const needle=query.value.trim().toLocaleLowerCase();
  return !needle || [node.draft.title,node.draft.body]
    .some(value=>value.toLocaleLowerCase().includes(needle));
}).sort((a,b)=>a.draft.title.localeCompare(b.draft.title,'ja')).slice(0,100));
const active=computed(()=>entries.value.find(node=>node.id===highlightedId.value)??null);
const activeSections=computed(()=>active.value?.kind==='tip'
  ? props.nodes.filter(node=>node.kind==='tipSection' && node.parentId===active.value?.id)
      .sort((a,b)=>a.order-b.order || a.draft.title.localeCompare(b.draft.title,'ja'))
  : []);
const labels={tip:'設定',word:'単語',grammar:'文法'} as const;
watch(()=>props.selectedId,()=>{highlightedId.value='';});
</script>

<template>
  <section class="author-reference" aria-label="執筆資料の参照">
    <h3>同じシリーズの資料を参照</h3>
    <p class="note">作者用の下書きを表示します。参照操作だけでは公開版は変更されません。</p>
    <div class="reference-filters">
      <label>検索
        <input v-model="query" type="search" placeholder="設定・単語・文法" />
      </label>
      <label>種類
        <select v-model="kindFilter">
          <option value="all">すべて</option>
          <option value="tip">設定</option>
          <option value="word">単語</option>
          <option value="grammar">文法</option>
        </select>
      </label>
    </div>
    <p v-if="!entries.length" class="note">該当する資料はありません。</p>
    <ul v-else class="reference-list">
      <li v-for="entry in entries" :key="entry.id">
        <button type="button" class="inline-action" :aria-pressed="highlightedId===entry.id"
          @click="highlightedId=highlightedId===entry.id?'':entry.id">
          {{ labels[entry.kind as 'tip'|'word'|'grammar'] }}：{{ entry.draft.title }}
        </button>
      </li>
    </ul>
    <article v-if="active && active.id!==selectedId" class="reference-detail">
      <h4>{{ active.draft.title }}</h4>
      <p class="note">{{ active.published?'公開版あり':'未公開' }}（作者の下書き）</p>
      <p class="reference-body">{{ active.draft.body || '本文はありません。' }}</p>
      <WordMeaningsReader v-if="active.kind==='word'" :serialized="active.draft.details.meanings" />
      <dl v-if="activeSections.length" class="reference-sections">
        <div v-for="section in activeSections" :key="section.id">
          <dt>{{ section.draft.title }}</dt>
          <dd>{{ section.draft.body || '内容は未入力です。' }}</dd>
        </div>
      </dl>
    </article>
  </section>
</template>
<style scoped>
.author-reference { border:1px solid var(--color-border-base);border-radius:var(--radius-panel);padding:1rem;margin:1.5rem 0;min-width:0; }
.reference-filters { display:flex;gap:.75rem;flex-wrap:wrap; }
.reference-filters label { flex:1 1 9rem;font-weight:normal; }
.reference-filters input,.reference-filters select { display:block;width:100%;min-width:0;margin-top:.35rem; }
.reference-list { list-style:none;padding:0;max-height:16rem;overflow:auto;display:flex;gap:.4rem;flex-wrap:wrap; }
.reference-list button { font-size:var(--font-size-s); }
.reference-list button[aria-pressed=true] { outline:2px solid var(--color-concept-main); }
.reference-detail { margin-top:1rem;padding:.75rem;background:var(--color-background-base); }
.reference-body { white-space:pre-wrap;overflow-wrap:anywhere;max-height:16rem;overflow:auto; }
.reference-sections { margin:1rem 0 0;max-height:20rem;overflow-y:auto; }
.reference-sections > div { border-top:1px solid var(--color-border-base);padding:.6rem 0; }
.reference-sections dt { font-weight:700; }
.reference-sections dd { white-space:pre-wrap;overflow-wrap:anywhere;margin:.3rem 0 0; }
</style>
