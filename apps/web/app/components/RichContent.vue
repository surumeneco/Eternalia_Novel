<script setup lang="ts">
const props = withDefaults(defineProps<{ source: string; paged?: boolean }>(), { paged: false });
interface Token { base: string; reading?: string }
function tokenize(source: string): Token[] {
  const result: Token[] = [];
  const pattern = /｜([^《\n]+)《([^》\n]+)》/g;
  let offset = 0, match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    if (match.index > offset) result.push({ base: source.slice(offset, match.index) });
    result.push({ base: match[1] ?? '', reading: match[2] ?? undefined });
    offset = pattern.lastIndex;
  }
  if (offset < source.length) result.push({ base: source.slice(offset) });
  return result;
}
const pages = computed(() => props.source.split('[[page]]').map(tokenize));
const currentPage = ref(0);
watch(() => props.source, () => { currentPage.value = 0; });
const displayed = computed(() => props.paged
  ? [pages.value[currentPage.value] ?? []] : pages.value);
function move(delta: number) {
  currentPage.value = Math.max(0, Math.min(pages.value.length - 1, currentPage.value + delta));
}
</script>
<template>
  <div class="rich-content">
    <template v-if="paged && pages.length > 1">
      <nav class="reading-pages" aria-label="本文のページ移動">
        <button type="button" class="inline-action" :disabled="currentPage === 0" @click="move(-1)">前のページ</button>
        <span aria-live="polite">{{ currentPage + 1 }} / {{ pages.length }}</span>
        <button type="button" class="inline-action" :disabled="currentPage === pages.length - 1" @click="move(1)">次のページ</button>
      </nav>
    </template>
    <section v-for="(page, pageIndex) in displayed" :key="paged ? currentPage : pageIndex" class="rich-page">
      <p v-if="!paged && pages.length > 1" class="note">ページ {{ pageIndex + 1 }} / {{ pages.length }}</p>
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
