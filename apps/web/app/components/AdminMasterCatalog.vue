<script setup lang="ts">
import { localizeApiError } from '~/utils/api-error-localization';

type MasterType = 'tags' | 'classifications';
interface MasterRow {
  id: string; group?: string; kind?: string; name: string;
  value?: string; order: number; revision: number;
}
const props = defineProps<{ type: MasterType }>();
const { t, language } = useUiLocale();
const { confirm: showConfirmation } = useAppDialog();
const { data: auth, refresh: refreshAuth } = await useFetch<{authenticated:boolean}>('/api/auth/me');
const rows = ref<MasterRow[]>([]);
const newRow = reactive({ group:'', kind:'', name:'', value:'', order:0 });
const pending = ref(false);
const errorText = ref('');
const statusText = ref('');
const isTag = computed(() => props.type === 'tags');
const title = computed(() => t(isTag.value ? 'tagMaster' : 'classificationMaster'));
const wording = (ja: string, en: string) => language.value === 'en' ? en : ja;
const api = computed(() => '/api/admin/masters/' + props.type);
async function load() {
  if (!auth.value?.authenticated) return;
  pending.value = true;
  errorText.value = '';
  try { rows.value = (await $fetch<MasterRow[]>(api.value)).map(item => ({ ...item })); }
  catch (error: unknown) { errorText.value = localizeApiError(error, language.value, t, t('studioLibraryLoadError')); }
  finally { pending.value = false; }
}
async function create() {
  if (pending.value) return;
  pending.value = true;
  errorText.value = ''; statusText.value = '';
  try {
    await $fetch(api.value, {method:'POST',body:{...newRow}});
    newRow.name = ''; newRow.value = ''; newRow.order = 0;
    statusText.value = wording('項目を追加しました。','Entry created.');
  } catch (error: unknown) {
    errorText.value = localizeApiError(error, language.value, t, t('studioSaveError'));
  } finally { pending.value = false; }
  if (!errorText.value) await load();
}
async function save(row: MasterRow) {
  if (pending.value) return;
  pending.value = true;
  errorText.value = ''; statusText.value = '';
  try {
    await $fetch(api.value + '/' + encodeURIComponent(row.id), {
      method:'PATCH',body:{ ...row, expectedRevision:row.revision },
    });
    statusText.value = wording('更新しました。','Updated.');
  } catch (error: unknown) {
    errorText.value = localizeApiError(error, language.value, t, t('studioSaveError'));
  } finally { pending.value = false; }
  if (!errorText.value) await load();
}
async function remove(row: MasterRow) {
  if (pending.value || !await showConfirmation(wording(
    '「' + row.name + '」を削除しますか？使用中のタグは削除できません。',
    'Delete "' + row.name + '"? Tags in use cannot be deleted.',
  ))) return;
  pending.value = true;
  errorText.value = ''; statusText.value = '';
  try {
    await $fetch(api.value + '/' + encodeURIComponent(row.id), {
      method:'DELETE',body:{expectedRevision:row.revision},
    });
    statusText.value = wording('削除しました。','Deleted.');
  } catch (error: unknown) {
    errorText.value = localizeApiError(error, language.value, t, t('studioSaveError'));
  } finally { pending.value = false; }
  if (!errorText.value) await load();
}
onMounted(async () => { await refreshAuth(); if (auth.value?.authenticated) await load(); });
</script>

<template>
  <ReaderPanel>
    <h1>{{ title }}</h1>
    <p v-if="!auth?.authenticated" role="alert">{{ t('studioLoginRequired') }}</p>
    <template v-else>
      <p class="note">{{ wording('共通マスタはシリーズを横断する選択肢です。作品・資料の所属や公開状態は変更しません。',
        'This catalog supplies options across series; it does not change content ownership or publication.') }}</p>
      <p v-if="errorText" role="alert" class="error-text">{{ errorText }}</p>
      <p v-if="statusText" role="status">{{ statusText }}</p>
      <button type="button" class="inline-action" :disabled="pending" @click="load">{{ t('studioReload') }}</button>
      <div class="master-table-wrap">
        <table class="master-table">
          <thead><tr>
            <th scope="col">{{ isTag ? wording('グループ','Group') : wording('種別','Kind') }}</th>
            <th scope="col">{{ wording('名称','Name') }}</th>
            <th v-if="!isTag" scope="col">{{ wording('値','Value') }}</th>
            <th scope="col">{{ wording('表示順','Order') }}</th>
            <th scope="col">{{ wording('操作','Actions') }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td><input v-if="isTag" v-model="row.group" maxlength="100" :aria-label="wording('タググループ','Tag group')" />
                  <input v-else v-model="row.kind" maxlength="100" :aria-label="wording('区分種別','Division kind')" /></td>
              <td><input v-model="row.name" maxlength="100" :aria-label="wording('名称','Name')" /></td>
              <td v-if="!isTag"><input v-model="row.value" maxlength="500" :aria-label="wording('値','Value')" /></td>
              <td><input v-model.number="row.order" type="number" min="0" max="1000000" step="1" :aria-label="wording('表示順','Order')" /></td>
              <td class="master-actions">
                <button class="inline-action" type="button" :disabled="pending" @click="save(row)">{{ wording('保存','Save') }}</button>
                <button class="inline-action" type="button" :disabled="pending" @click="remove(row)">{{ wording('削除','Delete') }}</button>
              </td>
            </tr>
            <tr>
              <td><input v-if="isTag" v-model="newRow.group" maxlength="100" :aria-label="wording('新規タググループ','New tag group')" required />
                  <input v-else v-model="newRow.kind" maxlength="100" :aria-label="wording('新規区分種別','New division kind')" required /></td>
              <td><input v-model="newRow.name" maxlength="100" :aria-label="wording('新規名称','New name')" required /></td>
              <td v-if="!isTag"><input v-model="newRow.value" maxlength="500" :aria-label="wording('新規区分値','New division value')" /></td>
              <td><input v-model.number="newRow.order" type="number" min="0" max="1000000" step="1" :aria-label="wording('新規表示順','New order')" /></td>
              <td><button class="inline-action" type="button" :disabled="pending || !newRow.name.trim() || !(isTag ? newRow.group.trim() : newRow.kind.trim())" @click="create">{{ wording('追加','Add') }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!rows.length && !pending" class="note">{{ t('studioEmpty') }}</p>
    </template>
  </ReaderPanel>
</template>
<style scoped>
.master-table-wrap{overflow-x:auto;max-width:100%;margin-top:1rem;}
.master-table{width:100%;border-collapse:collapse;min-width:36rem;}
.master-table th,.master-table td{padding:.5rem;border-bottom:1px solid var(--color-border-base);text-align:start;}
.master-table input{width:100%;min-width:5rem;padding:.4rem;background:var(--color-background-input);color:var(--color-text-base);border:1px solid var(--color-border-base);border-radius:var(--radius-input);}
.master-actions{white-space:nowrap;}
.master-actions button+button{margin-inline-start:.3rem;}
</style>
