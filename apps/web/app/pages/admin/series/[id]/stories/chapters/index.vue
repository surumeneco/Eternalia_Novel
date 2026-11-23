<script setup lang="ts">const route=useRoute();const {t}=useUiLocale();</script>
<template><div><AdminNodeGrid :series-id="String(route.params.id)" kind="chapter" :title="t('chapter')" /></div></template>
