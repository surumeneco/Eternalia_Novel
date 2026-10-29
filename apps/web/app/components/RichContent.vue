<script setup lang="ts">
const props = defineProps<{ source: string }>();
interface Token { base: string; reading?: string }
function tokenize(source: string): Token[] {
  const result: Token[] = [];
  const pattern = /｜([^《\n]+)《([^》\n]+)》/g;
  let offset = 0, match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    if (match.index > offset) result.push({ base: source.slice(offset, match.index) });
    result.push({ base: match[1], reading: match[2] });
    offset = pattern.lastIndex;
  }
  if (offset < source.length) result.push({ base: source.slice(offset) });
  return result;
}
const pages = computed(() => props.source.split('[[page]]').map(tokenize));
</script>
<template>
  <div class="rich-content">
    <section v-for="(page, pageIndex) in pages" :key="pageIndex" class="rich-page">
      <p v-if="pages.length > 1" class="note">ページ {{ pageIndex + 1 }} / {{ pages.length }}</p>
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
ruby rt { font-size: .6em; }
</style>
