<script setup lang="ts">
import { tokenizeRichContent } from '~/utils/rich-content-tokenizer';
const { t } = useUiLocale();
const props = withDefaults(defineProps<{ source: string; pages?: string[]; paged?: boolean }>(), { paged: false });
const pages = computed(() => (props.pages ?? props.source.split('[[page]]')).map(tokenizeRichContent));
const currentPage = ref(0);
// Until Vue mounts, SSR must expose every page of a published chapter.
// Without JavaScript there is no working pager, so rendering just page one
// would make the remaining published content permanently unreachable.
const clientReady = ref(false);
onMounted(() => { clientReady.value = true; });
watch(() => [props.source, props.pages], () => { currentPage.value = 0; });
const displayed = computed(() => props.paged && clientReady.value
  ? [pages.value[currentPage.value] ?? []] : pages.value);
function move(delta: number) {
  currentPage.value = Math.max(0, Math.min(pages.value.length - 1, currentPage.value + delta));
}
</script>
<template>
  <div class="rich-content">
    <template v-if="paged && clientReady && pages.length > 1">
      <nav class="reading-pages" :aria-label="t('readerPagesNav')">
        <button type="button" class="inline-action" :disabled="currentPage === 0" @click="move(-1)">{{ t('readerPreviousPage') }}</button>
        <span aria-live="polite">{{ currentPage + 1 }} / {{ pages.length }}</span>
        <button type="button" class="inline-action" :disabled="currentPage === pages.length - 1" @click="move(1)">{{ t('readerNextPage') }}</button>
      </nav>
    </template>
    <section v-for="(page, pageIndex) in displayed" :key="paged && clientReady ? currentPage : pageIndex" class="rich-page">
      <p v-if="(!paged || !clientReady) && pages.length > 1" class="note">{{ t('readerPage') }} {{ pageIndex + 1 }} / {{ pages.length }}</p>
      <p class="rich-body">
        <template v-for="(token, tokenIndex) in page" :key="tokenIndex">
          <ruby v-if="token.reading">{{ token.base }}<rt>{{ token.reading }}</rt></ruby>
          <template v-else>{{ token.base }}</template>
        </template>
      </p>
    </section>
  </div>
</template>
<style scoped>
.rich-page + .rich-page { border-top: 1px dashed var(--color-border-base); padding-top: 1.4rem; margin-top: 1.4rem; }
.rich-body { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 2.05; font-family: "Noto Serif JP", "Yu Mincho", serif; }
.reading-pages { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; margin: 1rem 0 1.5rem; }
ruby rt { font-size: .6em; }
</style>
