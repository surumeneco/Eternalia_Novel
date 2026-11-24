<script setup lang="ts">
const { t } = useUiLocale();
import type { ReaderKind } from '~/types/reader';
import { adminEditPath } from '~/utils/admin-node-route';
const props = defineProps<{ itemId: string; itemKind:ReaderKind; seriesId?:string }>();
const destination=computed(()=>props.itemKind==='series' ? adminEditPath(props.itemId,'series',props.itemId) :
  props.seriesId ? adminEditPath(props.seriesId,props.itemKind,props.itemId) : null);
const {data:session}=useNuxtData<{authenticated:boolean}>('eternalia-author-menu-auth');
const clientReady=ref(false);
onMounted(()=>{clientReady.value=true;});
const isAuthor=computed(()=>clientReady.value&&session.value?.authenticated===true);
</script>

<template>
  <NuxtLink v-if="isAuthor && destination" :to="destination" class="author-edit-link">
    {{ t('readerAuthorEdit') }}
  </NuxtLink>
</template>

<style scoped>
.author-edit-link { display:inline-block;margin:.6rem 0;font-size:var(--font-size-s); }
</style>
