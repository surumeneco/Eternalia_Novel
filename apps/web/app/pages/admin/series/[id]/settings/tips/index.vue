<script setup lang="ts">const route=useRoute();const {t}=useUiLocale();</script>
<template><div><AdminNodeGrid :series-id="String(route.params.id)" kind="tip" :title="t('tip')" /></div></template>
