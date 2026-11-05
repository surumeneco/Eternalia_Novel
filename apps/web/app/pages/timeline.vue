<script setup lang="ts">
const route = useRoute();
const { t } = useUiLocale();
</script>
<template>
  <NuxtPage v-if="route.params.id" />
  <PublicCollectionPage v-else :title="t('timeline')" :description="t('timelineCollectionDescription')" section="timeline" />
</template>
