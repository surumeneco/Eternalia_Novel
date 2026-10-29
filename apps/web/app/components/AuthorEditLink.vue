<script setup lang="ts">
const props = defineProps<{ itemId: string }>();
const isAuthor = ref(false);
onMounted(async () => {
  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/auth/me');
    isAuthor.value = session.authenticated === true;
  } catch {
    isAuthor.value = false;
  }
});
</script>

<template>
  <NuxtLink v-if="isAuthor" :to="{ path: '/studio', query: { item: props.itemId } }" class="author-edit-link">
    この項目を編集
  </NuxtLink>
</template>

<style scoped>
.author-edit-link { display:inline-block;margin:.6rem 0;font-size:var(--font-size-s); }
</style>
