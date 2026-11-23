<script setup lang="ts">const route=useRoute();const {t}=useUiLocale();const {data:auth}=await useFetch<{authenticated:boolean}>('/api/auth/me');</script>
<template><div><ReaderPanel><h1>{{t('adminHome')}}</h1>
  <nav v-if="auth?.authenticated" class="reader-list"><NuxtLink to="/admin/series">{{t('studioKindSeries')}}</NuxtLink>
    <NuxtLink to="/admin/masters">{{t('masterMaintenance')}}</NuxtLink>
    <NuxtLink to="/studio/memos">{{t('studioMemos')}}</NuxtLink></nav></ReaderPanel></div></template>
