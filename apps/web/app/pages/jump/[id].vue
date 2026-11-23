<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
import { publicNodeRoute } from '~/utils/public-node-route';
const route=useRoute();
const {t}=useUiLocale();
const id=computed(()=>String(route.params.id));
const {data:path,error}=await useFetch<ReaderNode[]>(()=>'/api/public/items/'+encodeURIComponent(id.value)+'/path');
const destination=computed(()=>publicNodeRoute(path.value??[],id.value));
if(destination.value) await navigateTo(destination.value,{replace:true,redirectCode:302});
</script>
<template><div><ReaderPanel><h1>{{ t('readerErrorNotPublic') }}</h1>
  <p v-if="error">{{ t('readerErrorNotPublic') }}</p><NuxtLink to="/">{{ t('home') }}</NuxtLink>
</ReaderPanel></div></template>
