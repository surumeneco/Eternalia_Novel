<script setup lang="ts">
const { t } = useUiLocale();
</script>
<template>
  <PublicCollectionPage :title="t('timeline')" :description="t('timelineCollectionDescription')" section="timeline" />
</template>
