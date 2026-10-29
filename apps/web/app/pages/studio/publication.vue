<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
import type { ReaderKind } from '~/types/reader';

interface AuthState { configured: boolean; authenticated: boolean }
const { data: auth, pending: authPending, refresh: refreshAuth } = await useFetch<AuthState>('/api/auth/me');
const nodes = ref<AuthorNode[]>([]);
const loading = ref(false);
const busyId = ref<string | null>(null);
const errorText = ref('');
const successText = ref('');
const section = ref('all');
const statusFilter = ref('all');
const search = ref('');
const scheduled = reactive<Record<string, string>>({});
function localDateTime(ms: number): string {
  const date = new Date(ms);
  return new Date(ms - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const types: Record<ReaderKind, string> = {
  series: 'シリーズ', volume: '編', part: '部', chapter: '章',
  category: 'カテゴリ', tip: '設定', tipSection: '設定項目',
  language: '言語', word: '単語', grammar: '文法',
  periodization: '年代区分', event: '出来事',
};
const sections: Record<string, ReaderKind[]> = {
  all: Object.keys(types) as ReaderKind[],
  stories: ['series', 'volume', 'part', 'chapter'],
  tips: ['series', 'category', 'tip', 'tipSection'],
  dictionaries: ['series', 'language', 'word', 'grammar'],
  timeline: ['series', 'periodization', 'event'],
};
const byId = computed(() => new Map(nodes.value.map(node => [node.id, node])));
function ancestry(node: AuthorNode): AuthorNode[] {
  const path: AuthorNode[] = [];
  const visited = new Set<string>();
  let current: AuthorNode | undefined = node;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    current = current.parentId ? byId.value.get(current.parentId) : undefined;
  }
  return path;
}
function published(node: AuthorNode): boolean {
  const now = Date.now();
  return ancestry(node).every(item =>
    item.published !== null && item.isPublic && item.publicSince !== null && item.publicSince <= now);
}
function status(node: AuthorNode): string {
  if (!node.published) return '公開版なし';
  if (!node.isPublic) return '自身が非公開';
  if (node.publicSince === null) return '公開日時未設定';
  if (node.publicSince > Date.now()) return '公開待ち';
  const blocked = ancestry(node).slice(0, -1).find(item =>
    !item.published || !item.isPublic || item.publicSince === null || item.publicSince > Date.now());
  return blocked ? '親による非公開' : '閲覧可能';
}
const filtered = computed(() => nodes.value.filter(node => {
  if (!sections[section.value]?.includes(node.kind)) return false;
  if (search.value.trim()) {
    const needle = search.value.trim().toLocaleLowerCase();
    if (!ancestry(node).some(part => part.draft.title.toLocaleLowerCase().includes(needle))) return false;
  }
  if (statusFilter.value === 'visible' && !published(node)) return false;
  if (statusFilter.value === 'hidden' && published(node)) return false;
  if (statusFilter.value === 'unpublished' && node.published) return false;
  return true;
}).sort((a, b) =>
  ancestry(a).map(x => x.order.toString().padStart(8, '0')).join('/')
    .localeCompare(ancestry(b).map(x => x.order.toString().padStart(8, '0')).join('/'))
));
function pathTitle(node: AuthorNode): string {
  return ancestry(node).map(item => item.draft.title).join(' / ');
}
async function load() {
  if (!auth.value?.authenticated) return;
  loading.value = true;
  errorText.value = '';
  try {
    nodes.value = await $fetch<AuthorNode[]>('/api/admin/nodes');
    for (const node of nodes.value) {
      scheduled[node.id] = node.publicSince === null ? '' : localDateTime(node.publicSince);
    }
  } catch {
    errorText.value = '公開管理データを取得できません。';
  } finally {
    loading.value = false;
  }
}
onMounted(async () => {
  await refreshAuth();
  if (auth.value?.authenticated) await load();
});
async function saveSchedule(node: AuthorNode) {
  if (busyId.value || !node.published) return;
  const input = scheduled[node.id];
  const time = input ? new Date(input).getTime() : NaN;
  if (!Number.isSafeInteger(time) || time < 0) {
    errorText.value = '公開開始日時を入力してください。';
    return;
  }
  busyId.value = node.id;
  errorText.value = '';
  successText.value = '';
  try {
    await $fetch('/api/admin/nodes/' + encodeURIComponent(node.id) + '/visibility', {
      method: 'POST',
      body: { expectedRevision: node.revision, isPublic: node.isPublic, publicSince: time },
    });
    await load();
    successText.value = '公開開始日時を更新しました。';
  } catch {
    errorText.value = '日時の変更に失敗しました。競合の可能性があるため再読込してください。';
  } finally {
    busyId.value = null;
  }
}
async function action(node: AuthorNode, kind: 'publish' | 'visibility') {
  if (busyId.value) return;
  if (kind === 'publish' && !window.confirm('保存済みの下書きを公開版に反映し、公開設定を有効にします。よろしいですか？')) return;
  const nextVisibility = !node.isPublic;
  if (kind === 'visibility' && nextVisibility && !node.published) {
    errorText.value = '公開版がない項目は、先に公開版を作成してください。';
    return;
  }
  busyId.value = node.id;
  errorText.value = '';
  successText.value = '';
  try {
    if (kind === 'publish') {
      await $fetch('/api/admin/nodes/' + encodeURIComponent(node.id) + '/publish', {
        method: 'POST', body: { expectedRevision: node.revision },
      });
    } else {
      await $fetch('/api/admin/nodes/' + encodeURIComponent(node.id) + '/visibility', {
        method: 'POST',
        body: { expectedRevision: node.revision, isPublic: nextVisibility, publicSince: node.publicSince },
      });
    }
    await load();
    successText.value = '公開設定を更新しました。';
  } catch (error: unknown) {
    const response = error as { data?: { message?: string | string[] }; statusCode?: number };
    const message = response.data?.message;
    errorText.value = Array.isArray(message) ? message.join(' / ') :
      typeof message === 'string' ? message : '更新に失敗しました。再読込して改訂番号を確認してください。';
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <div>
    <TopicPath :items="[
      { label: 'ホーム', to: '/' },
      { label: '作者の書斎', to: '/studio' },
      { label: '公開管理' },
    ]" />
    <ReaderPanel>
      <div class="publication-header">
        <h1>公開管理</h1>
        <NuxtLink to="/studio">執筆・編集へ戻る</NuxtLink>
      </div>
      <p v-if="authPending" role="status">認証状態を確認しています。</p>
      <div v-else-if="!auth?.configured" role="alert">作者認証が設定されていません。</div>
      <div v-else-if="!auth.authenticated" role="alert">
        <p>公開管理には作者としてのログインが必要です。</p>
        <a href="/api/auth/discord">Discordでログイン</a>
      </div>
      <template v-else>
        <div class="publication-filters">
          <label>領域
            <select v-model="section">
              <option value="all">すべて</option>
              <option value="stories">ストーリー</option>
              <option value="tips">設定集</option>
              <option value="dictionaries">辞書</option>
              <option value="timeline">年表</option>
            </select>
          </label>
          <label>公開状態
            <select v-model="statusFilter">
              <option value="all">すべて</option>
              <option value="visible">閲覧可能</option>
              <option value="hidden">閲覧不可</option>
              <option value="unpublished">公開版なし</option>
            </select>
          </label>
          <label>名称を検索
            <input v-model="search" type="search" placeholder="シリーズ・項目名" />
          </label>
        </div>
        <div class="publication-toolbar">
          <p>表示 {{ filtered.length }} 件</p>
          <button type="button" class="inline-action" :disabled="loading || !!busyId" @click="load">再読込</button>
        </div>
        <p v-if="successText" role="status">{{ successText }}</p>
        <p v-if="errorText" class="error-text" role="alert">{{ errorText }}</p>
        <p v-if="loading" role="status">公開状態を読み込んでいます。</p>
        <p v-else-if="!filtered.length">該当する項目はありません。</p>
        <ul v-else class="publication-list">
          <li v-for="node in filtered" :key="node.id">
            <div class="publication-row">
              <div class="publication-summary">
                <span class="note">{{ types[node.kind] }} · {{ status(node) }}</span>
                <h2>{{ node.draft.title }}</h2>
                <p class="note publication-path">{{ pathTitle(node) }}</p>
                <p class="note">
                  自身：{{ node.isPublic ? '公開' : '非公開' }} ／ 公開版：{{ node.published ? 'あり' : 'なし' }}
                  ／ 公開日時：{{ node.publicSince === null ? '未設定' : new Date(node.publicSince).toLocaleString('ja-JP') }}
                </p>
              </div>
              <div class="publication-actions">
                <button type="button" class="inline-action" :disabled="!!busyId" @click="action(node, 'publish')">
                  公開版を更新
                </button>
                <button type="button" class="inline-action" :disabled="!!busyId" @click="action(node, 'visibility')">
                  {{ node.isPublic ? '非公開にする' : '公開にする' }}
                </button>
                <label class="schedule-field">公開開始日時
                  <input v-model="scheduled[node.id]" type="datetime-local" :disabled="!!busyId || !node.published" />
                </label>
                <button type="button" class="inline-action" :disabled="!!busyId || !node.published" @click="saveSchedule(node)">
                  日時を保存
                </button>
                <NuxtLink :to="{ path: '/studio', query: { item: node.id } }">編集</NuxtLink>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.publication-header,.publication-toolbar,.publication-row { display:flex;justify-content:space-between;gap:1rem;align-items:flex-start; }
.publication-header { align-items:center; }
.publication-filters { display:flex;flex-wrap:wrap;gap:.8rem;margin:1.25rem 0; }
.publication-filters label { flex:1 1 11rem;min-width:0; }
.publication-filters input,.publication-filters select {
  display:block;width:100%;margin-top:.4rem;padding:.55rem;
  color:var(--color-text-base);background:var(--color-background-input);
  border:1px solid var(--color-border-base);border-radius:var(--radius-input);
}
.publication-list { list-style:none;margin:1rem 0;padding:0; }
.publication-list li { border-top:1px solid var(--color-border-base);padding:1rem 0; }
.publication-summary { min-width:0; }
.publication-summary h2 { font-size:1.15rem;margin:.3rem 0;overflow-wrap:anywhere; }
.publication-path { overflow-wrap:anywhere; }
.schedule-field { display:block;font-size:.8rem; }
.schedule-field input { margin-top:.25rem;width:auto;max-width:100%; }
.publication-actions { display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:flex-end;flex:0 0 auto; }
@media (max-width:740px) {
  .publication-row { flex-direction:column; }
  .publication-actions { justify-content:flex-start; }
}
</style>
