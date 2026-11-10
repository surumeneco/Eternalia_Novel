<script setup lang="ts">
const route = useRoute();
</script>
<template>
  <NuxtPage v-if="route.params.id" />
  <PublicCollectionPage v-else title="辞書" description="シリーズの創作言語、単語、文法を閲覧します。" section="dictionaries" />
</template>
