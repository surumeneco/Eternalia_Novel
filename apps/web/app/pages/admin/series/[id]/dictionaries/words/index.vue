<script setup lang="ts">const route=useRoute();const {t}=useUiLocale();</script>
<template><div><AdminNodeGrid :series-id="String(route.params.id)" kind="word" :title="t('word')" /></div></template>
