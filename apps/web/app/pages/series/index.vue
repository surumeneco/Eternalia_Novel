<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const {t}=useUiLocale();
const {data:series,pending,error,refresh}=await useFetch<ReaderNode[]>('/api/public/series');
</script>
<template><div><TopicPath :items="[{label:t('home'),to:'/'},{label:t('publishedSeries')}]" />
  <ReaderPanel><h1>{{ t('publishedSeries') }}</h1>
    <ReadingSkeleton v-if="pending" :label="t('loading')" />
    <div v-else-if="error" role="alert"><button type="button" class="inline-action" @click="refresh()">{{ t('retry') }}</button></div>
    <ul v-else class="reader-list"><li v-for="item in series??[]" :key="item.id"><NuxtLink :to="'/series/'+item.id">{{ item.content.title }}</NuxtLink></li></ul>
  </ReaderPanel></div></template>
