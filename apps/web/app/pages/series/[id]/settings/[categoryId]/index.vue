<script setup lang="ts">
const route = useRoute();
</script>
<template>
  <ReaderDomainListing :series-id="String(route.params.id)" area="settings" :parent-id="String(route.params.categoryId)" />
</template>
