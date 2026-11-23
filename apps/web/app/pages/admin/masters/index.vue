<script setup lang="ts">const route=useRoute();const {t}=useUiLocale();</script>
<template><div><ReaderPanel><h1>{{t('masterMaintenance')}}</h1><nav class="reader-list"><NuxtLink to="/admin/masters/classifications">{{t('classificationMaster')}}</NuxtLink><NuxtLink to="/admin/masters/tags">{{t('tagMaster')}}</NuxtLink></nav></ReaderPanel></div></template>
