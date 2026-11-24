<script setup lang="ts">
import type { ReaderKind } from '~/types/reader';
import { adminCreatePath } from '~/utils/admin-node-route';

const props = defineProps<{
  kind: ReaderKind;
  label: string;
  parentId?: string | null;
  seriesId?: string | null;
}>();

const isAuthor = ref(false);
onMounted(async () => {
  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/auth/me');
    isAuthor.value = session.authenticated === true;
  } catch {
    isAuthor.value = false;
  }
});

const destination = computed(() => props.kind==='series' ? adminCreatePath(null,'series',null) :
  props.seriesId&&props.parentId ? adminCreatePath(props.seriesId,props.kind,props.parentId) : null);
</script>

<template>
  <NuxtLink v-if="isAuthor && destination" :to="destination" class="author-create-link"
    :aria-label="props.label">{{ props.label }}</NuxtLink>
</template>

<style scoped>
.author-create-link { display:inline-block;margin:.4rem .6rem .4rem 0;font-size:var(--font-size-s); }
.author-create-link:focus-visible { outline:3px solid var(--color-concept-main); outline-offset:2px; }
</style>
