<script setup lang="ts">
const { t } = useUiLocale();
</script>
<template>
  <PublicCollectionPage :title="t('stories')" :description="t('storiesCollectionDescription')" section="stories" />
</template>
