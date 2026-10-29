<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
import type { ReaderKind } from '~/types/reader';

interface AuthState { configured: boolean; authenticated: boolean }
const { data: auth, pending: authPending, refresh: refreshAuth } =
  await useFetch<AuthState>('/api/auth/me');

const kinds: Record<ReaderKind, string> = {
  series: 'シリーズ', volume: '編', part: '部', chapter: '章',
  category: 'カテゴリ', tip: '設定', tipSection: '設定項目',
  language: '言語', word: '単語', grammar: '文法',
  periodization: '年代区分', event: '出来事',
};
const children: Record<ReaderKind | 'root', ReaderKind[]> = {
  root: ['series'],
  series: ['volume', 'category', 'language', 'periodization'],
  volume: ['part'], part: ['chapter'], chapter: [],
  category: ['tip'], tip: ['tipSection'], tipSection: [],
  language: ['word', 'grammar'], word: [], grammar: [],
  periodization: ['event'], event: [],
};
const filters = {
  all: { label: 'すべて', kinds: Object.keys(kinds) as ReaderKind[] },
  stories: { label: '執筆', kinds: ['series','volume','part','chapter'] as ReaderKind[] },
  tips: { label: '設定', kinds: ['series','category','tip','tipSection'] as ReaderKind[] },
  dictionaries: { label: '辞書', kinds: ['series','language','word','grammar'] as ReaderKind[] },
  timeline: { label: '年表', kinds: ['series','periodization','event'] as ReaderKind[] },
};
type Filter = keyof typeof filters;

const nodes = ref<AuthorNode[]>([]);
const selectedId = ref<string | null>(null);
const selected = computed(() => nodes.value.find(n => n.id === selectedId.value) ?? null);
const filter = ref<Filter>('all');
const busy = ref(false);
const errorText = ref('');
const statusText = ref('');
const form = reactive<{ title:string; body:string; details:Record<string,string> }>({
  title:'',body:'',details:{},
});
const createOpen = ref(false);
const createParentId = ref<string | null>(null);
const createKind = ref<ReaderKind>('series');
const createTitle = ref('');
const creationChoices = computed(() =>
  children[createParentId.value ? nodes.value.find(n => n.id === createParentId.value)?.kind || 'root' : 'root']
);

const byId = computed(() => new Map(nodes.value.map(node => [node.id,node])));
const ordered = computed(() => {
  const indexed = new Map<string | null,AuthorNode[]>();
  for (const node of nodes.value) {
    const bucket = indexed.get(node.parentId) ?? [];
    bucket.push(node);
    indexed.set(node.parentId,bucket);
  }
  for (const bucket of indexed.values()) bucket.sort((a,b) => a.order - b.order || a.draft.title.localeCompare(b.draft.title));
  const out: {node:AuthorNode; depth:number}[] = [];
  const visited = new Set<string>();
  function visit(parentId: string | null,depth:number) {
    for (const node of indexed.get(parentId) ?? []) {
      if (visited.has(node.id) || depth > 12) continue;
      visited.add(node.id);
      if (filters[filter.value].kinds.includes(node.kind)) out.push({node,depth});
      visit(node.id, depth+1);
    }
  }
  visit(null,0);
  return out;
});
watch(selected, (node) => {
  form.title = node?.draft.title ?? '';
  form.body = node?.draft.body ?? '';
  form.details = { ...(node?.draft.details ?? {}) };
}, { immediate:true });

const scheduledLocal = ref('');
watch(selected, node => {
  scheduledLocal.value = node?.publicSince
    ? new Date(node.publicSince - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16)
    : '';
}, { immediate: true });

async function load() {
  try {
    nodes.value = await $fetch<AuthorNode[]>('/api/admin/nodes');
    if (!nodes.value.some(n => n.id === selectedId.value)) selectedId.value = null;
    errorText.value = '';
  } catch (e: unknown) {
    errorText.value = 'ライブラリを取得できませんでした。認証・DB設定を確認してください。';
  }
}
onMounted(async () => {
  await refreshAuth();
  if (auth.value?.authenticated) await load();
});

async function runChange(work: () => Promise<void>, okText:string) {
  if (busy.value) return;
  busy.value = true; errorText.value=''; statusText.value='';
  try {
    await work();
    await load();
    statusText.value = okText;
  } catch (e: unknown) {
    const info = e as { data?: { message?: string | string[] } };
    errorText.value = Array.isArray(info.data?.message)
      ? info.data.message.join(' / ')
      : info.data?.message || '保存に失敗しました。再読込して競合状態を確認してください。';
  } finally { busy.value = false; }
}
function openCreate(parentId: string | null) {
  createParentId.value = parentId;
  const parent = parentId ? byId.value.get(parentId) : null;
  createKind.value = children[parent?.kind || 'root'][0] || 'series';
  createTitle.value = '';
  createOpen.value = true;
}
async function createItem() {
  if (!createTitle.value.trim()) { errorText.value='タイトルを入力してください。'; return; }
  await runChange(async () => {
    const response = await $fetch<{id:string}>('/api/admin/nodes',{
      method:'POST',
      body:{
        kind: createKind.value, parentId:createParentId.value,
        content:{
          title:createTitle.value.trim(), body:'',
          details:createKind.value === 'category' ? {presets:'[]'} : {},
        },
      },
    });
    createOpen.value=false;
    selectedId.value=response.id;
  }, '項目を作成しました。');
}
async function saveDraft() {
  const node = selected.value;
  if (!node) return;
  await runChange(async () => {
    await $fetch('/api/admin/nodes/' + node.id, {
      method:'PATCH',
      body: { expectedRevision:node.revision,content:{
        title:form.title,body:form.body,details:{...form.details},
      }},
    });
  }, '下書きを保存しました。公開版は変更されていません。');
}
async function publish() {
  const node=selected.value;
  if (!node || !confirm('保存済みの下書きを公開版へ反映します。未保存の変更は含みません。続行しますか？')) return;
  await runChange(async () => {
    await $fetch('/api/admin/nodes/' + node.id + '/publish',{
      method:'POST',body:{expectedRevision:node.revision},
    });
  }, '公開スナップショットを更新しました。');
}
async function changeVisibility(isPublic:boolean,publicSince:number | null) {
  const node=selected.value;
  if (!node) return;
  await runChange(async () => {
    await $fetch('/api/admin/nodes/' + node.id + '/visibility',{
      method:'POST',body:{expectedRevision:node.revision,isPublic,publicSince},
    });
  }, '公開条件を変更しました。');
}
async function schedule() {
  if (scheduledLocal.value && !Number.isFinite(new Date(scheduledLocal.value).getTime())) {
    errorText.value='日時が不正です。'; return;
  }
  await changeVisibility(selected.value?.isPublic ?? false,
    scheduledLocal.value ? new Date(scheduledLocal.value).getTime() : null);
}
async function logout() {
  await runChange(async () => {
    await $fetch('/api/auth/logout',{method:'POST',body:{}});
    selectedId.value=null;
    nodes.value=[];
    await refreshAuth();
  }, 'ログアウトしました。');
}
</script>

<template>
  <div>
    <TopicPath :items="[{label:'ホーム',to:'/'},{label:'作者の書斎'}]" />
    <ReaderPanel>
      <div class="studio-title">
        <div>
          <p class="note">AUTHOR STUDIO / α</p>
          <h1>作者の書斎</h1>
          <p>下書き保存と公開スナップショットの反映は別操作です。</p>
        </div>
        <button v-if="auth?.authenticated" class="inline-action" type="button" @click="logout">ログアウト</button>
      </div>
      <p v-if="authPending" role="status">認証状態を確認しています。</p>
      <div v-else-if="!auth?.configured" role="alert">
        <p>作者認証が設定されていません。サーバー側でDiscord OAuth2とPostgreSQLを設定してください。</p>
        <p class="note">匿名閲覧は認証なしで利用できます。</p>
      </div>
      <div v-else-if="!auth.authenticated">
        <p>編集するには、許可された作者のDiscordアカウントで認証してください。</p>
        <a class="login-link" href="/api/auth/discord">Discordでログイン</a>
      </div>
      <template v-else>
        <p v-if="statusText" class="status-success" role="status">{{ statusText }}</p>
        <p v-if="errorText" class="error-text" role="alert">{{ errorText }}</p>
        <div class="studio-grid">
          <aside class="studio-sidebar" aria-label="作者ライブラリ">
            <div class="section-header">
              <h2>ライブラリ</h2>
              <button class="inline-action" type="button" :disabled="busy" @click="load">再読込</button>
            </div>
            <div class="filter-row" role="group" aria-label="資料種別">
              <button v-for="(f, key) in filters" :key="key" class="inline-action"
                type="button" :aria-pressed="filter === key" @click="filter = key">{{ f.label }}</button>
            </div>
            <ul class="node-list">
              <li v-for="entry in ordered" :key="entry.node.id">
                <button class="node-button" type="button" :aria-pressed="selectedId === entry.node.id"
                  :style="{ paddingInlineStart: 10 + entry.depth * 13 + 'px' }"
                  @click="selectedId = entry.node.id">
                  <small class="note">{{ kinds[entry.node.kind] }}</small>
                  {{ entry.node.draft.title }}
                </button>
              </li>
            </ul>
            <p v-if="!nodes.length" class="note">項目がありません。</p>
            <button class="primary" type="button" :disabled="busy" @click="openCreate(null)">新規シリーズ</button>
            <button v-if="selected && children[selected.kind].length" class="inline-action" type="button"
              :disabled="busy" @click="openCreate(selected.id)">子項目を追加</button>
          </aside>
          <section class="studio-editor" aria-label="編集フォーム">
            <form v-if="createOpen" class="create-form" @submit.prevent="createItem">
              <h2>項目を追加</h2>
              <label>種類
                <select v-model="createKind">
                  <option v-for="kind in creationChoices" :key="kind" :value="kind">{{ kinds[kind] }}</option>
                </select>
              </label>
              <label>タイトル<input v-model="createTitle" maxlength="150" required /></label>
              <div class="action-row">
                <button class="primary" type="submit" :disabled="busy">作成</button>
                <button class="inline-action" type="button" @click="createOpen = false">キャンセル</button>
              </div>
            </form>
            <template v-else-if="selected">
              <h2>{{ kinds[selected.kind] }}：{{ selected.draft.title }}</h2>
              <p class="note">下書き改訂 {{ selected.revision }} ／ {{ selected.published ? '公開スナップショットあり' : '未公開' }}</p>
              <form @submit.prevent="saveDraft">
                <label>名称・見出し<input v-model="form.title" maxlength="150" required /></label>
                <label>本文・説明<textarea v-model="form.body" rows="14" maxlength="100000"
                  placeholder="ページ区切り: [[page]] ／ ルビ: ｜漢字《かんじ》"></textarea></label>
                <label v-if="selected.kind === 'category'">項目プリセット（JSON）
                  <textarea v-model="form.details.presets" rows="4" maxlength="10000"></textarea>
                </label>
                <label v-if="selected.kind === 'word'">品詞
                  <input v-model="form.details.partOfSpeech" maxlength="10000" />
                </label>
                <label v-if="selected.kind === 'event'">相対年
                  <input v-model="form.details.year" maxlength="10000" />
                </label>
                <div class="action-row"><button class="primary" type="submit" :disabled="busy">下書きを保存</button></div>
              </form>
              <hr />
              <h3>公開設定</h3>
              <p class="note">公開版を更新しても、祖先の非公開・予約公開条件を満たさない項目は読者から見えません。</p>
              <div class="action-row">
                <button class="primary" type="button" :disabled="busy" @click="publish">保存済み下書きを公開版へ反映</button>
                <button class="inline-action" type="button" :disabled="busy || !selected.published"
                  @click="changeVisibility(!selected.isPublic, selected.publicSince)">
                  {{ selected.isPublic ? '非公開にする' : '公開に戻す' }}
                </button>
              </div>
              <label>公開開始日時
                <input v-model="scheduledLocal" type="datetime-local" />
              </label>
              <button class="inline-action" type="button" :disabled="busy || !selected.published" @click="schedule">日時を設定</button>
              <hr />
              <h3>下書きプレビュー</h3>
              <RichContent :source="form.body" />
            </template>
            <div v-else>
              <h2>編集する項目を選択してください</h2>
              <p class="note">左のライブラリから選ぶか、新しくシリーズを作成してください。</p>
            </div>
          </section>
        </div>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.studio-title, .section-header { display:flex;justify-content:space-between;align-items:center;gap:1rem; }
.studio-title { margin-bottom:1rem; }
.studio-title h1 { margin:.25rem 0; }
.studio-grid { display:grid;grid-template-columns:minmax(210px,300px) minmax(0,1fr);gap:1rem;margin-top:1.5rem; }
.studio-sidebar, .studio-editor { padding:1rem;background:var(--color-background-soft);border:1px solid var(--color-border-base);border-radius:var(--radius-panel);min-width:0; }
.section-header h2 { margin:0; font-size:1.1rem; }
.filter-row { display:flex;flex-wrap:wrap;gap:.3rem;margin:1rem 0; }
.filter-row button { font-size:12px; }
.filter-row button[aria-pressed="true"],.node-button[aria-pressed="true"] { background:#005f7f; color:#fff; }
.node-list { list-style:none;padding:0;max-height:70vh;overflow:auto; }
.node-button { width:100%;text-align:left;padding:7px 10px;background:transparent;border:0;color:var(--color-text-base);overflow-wrap:anywhere; }
.node-button:hover { background:#35464c; }
.studio-sidebar > button { margin:.3rem .3rem .3rem 0; }
.studio-editor h2 { overflow-wrap:anywhere; }
label { display:block;margin:1rem 0;font-weight:650; }
input,select,textarea { display:block;width:100%;margin-top:.45rem;padding:.6rem .7rem;background:var(--color-background-input);color:var(--color-text-base);border:1px solid var(--color-border-base);border-radius:var(--radius-input); }
textarea { min-height:6rem;resize:vertical;line-height:1.7; }
.action-row { display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0; }
.primary,.login-link { display:inline-block;background:#00698c;border:1px solid var(--color-concept-main);color:#fff;padding:.45rem .8rem;text-decoration:none; }
.status-success { color:#bfffd4; }
hr { border:0;border-top:1px solid var(--color-border-base);margin:1.5rem 0; }
@media (max-width:900px) { .studio-grid { grid-template-columns:minmax(0,1fr); } .studio-title{align-items:flex-start;flex-direction:column;} }
</style>
