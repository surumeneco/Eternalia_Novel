<script setup lang="ts">
const route = useRoute();
</script>
<template>
  <ReaderDomainListing :series-id="String(route.params.id)" area="stories" :parent-id="String(route.params.volumeId)" />
</template>
