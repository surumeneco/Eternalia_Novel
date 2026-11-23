<script setup lang="ts">const {t}=useUiLocale();</script>
<template><div><TopicPath :items="[{label:t('home'),to:'/'},{label:t('readerErrorNotPublic')}]" />
  <ReaderPanel><h1>{{ t('readerErrorNotPublic') }}</h1><NuxtLink to="/">{{ t('home') }}</NuxtLink></ReaderPanel></div></template>
