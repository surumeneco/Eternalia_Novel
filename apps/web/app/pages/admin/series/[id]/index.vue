<script setup lang="ts">const route=useRoute();const {t}=useUiLocale();const {data:auth}=await useFetch<{authenticated:boolean}>('/api/auth/me');</script>
<template><div><ReaderPanel><h1>{{t('adminHome')}}</h1>
  <nav v-if="auth?.authenticated" class="admin-areas">
    <NuxtLink :to="'/admin/series/'+route.params.id+'/stories'">{{t('stories')}}</NuxtLink>
    <NuxtLink :to="'/admin/series/'+route.params.id+'/settings'">{{t('tips')}}</NuxtLink>
    <NuxtLink :to="'/admin/series/'+route.params.id+'/dictionaries'">{{t('dictionaries')}}</NuxtLink>
    <NuxtLink :to="'/admin/series/'+route.params.id+'/timeline'">{{t('timeline')}}</NuxtLink>
    <NuxtLink :to="'/admin/series/'+route.params.id+'/publication'">{{t('studioPublicationManagement')}}</NuxtLink>
    <NuxtLink :to="{path:'/studio/order',query:{series:route.params.id}}">{{t('studioReorder')}}</NuxtLink>
  </nav></ReaderPanel></div></template>
