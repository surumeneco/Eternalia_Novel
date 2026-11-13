<script setup lang="ts">
const { t } = useUiLocale();
defineProps<{ items: Array<{ label: string; to?: string }> }>();
</script>
<template>
  <nav class="topic-path" :aria-label="t('readerBreadcrumbs')">
    <ol>
      <li v-for="(item, index) in items" :key="index">
        <NuxtLink v-if="item.to" :to="item.to">{{ item.label }}</NuxtLink>
        <span v-else aria-current="page">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
