<script setup lang="ts">
const route = useRoute();
</script>
<template>
  <ReaderDomainDetail :series-id="String(route.params.id)" :node-id="String(route.params.periodId)" kind="periodization" />
</template>
