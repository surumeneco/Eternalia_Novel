<script setup lang="ts">
const { t } = useUiLocale();
const props = defineProps<{ itemId: string; itemKind?:string; seriesId?:string }>();
const destination=computed(()=>{
  if(!props.itemKind||!props.seriesId)return {path:'/studio',query:{item:props.itemId}};
  const s='/admin/series/'+encodeURIComponent(props.seriesId);
  if(props.itemKind==='series')return s+'/edit';
  const areas:Record<string,string>={volume:'stories/volumes',part:'stories/parts',chapter:'stories/chapters',
    category:'settings/categories',tip:'settings/tips',tipSection:'settings/sections',
    language:'dictionaries/languages',word:'dictionaries/words',grammar:'dictionaries/grammar',
    periodization:'timeline/periods',event:'timeline/events'};
  return areas[props.itemKind]?s+'/'+areas[props.itemKind]+'/'+encodeURIComponent(props.itemId)+'/edit':
    {path:'/studio',query:{item:props.itemId}};
});
const isAuthor = ref(false);
onMounted(async () => {
  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/auth/me');
    isAuthor.value = session.authenticated === true;
  } catch {
    isAuthor.value = false;
  }
});
</script>

<template>
  <NuxtLink v-if="isAuthor" :to="destination" class="author-edit-link">
    {{ t('readerAuthorEdit') }}
  </NuxtLink>
</template>

<style scoped>
.author-edit-link { display:inline-block;margin:.6rem 0;font-size:var(--font-size-s); }
</style>
