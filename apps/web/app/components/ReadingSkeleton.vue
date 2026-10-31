<script setup lang="ts">
withDefaults(defineProps<{ label?: string; lines?: number }>(), {
  label:'公開コンテンツを読み込んでいます。',
  lines:3,
});
</script>
<template>
  <div class="reading-skeleton" role="status" aria-live="polite" aria-busy="true">
    <p class="loading-label">{{ label }}</p>
    <div class="skeleton-lines" aria-hidden="true">
      <span v-for="i in Math.min(Math.max(lines,1),8)" :key="i" class="skeleton-line"
        :class="{ 'short': i===lines }"></span>
    </div>
  </div>
</template>
<style scoped>
.reading-skeleton { margin:.6rem 0 1rem; }
.loading-label { font-size:var(--font-size-s);color:var(--color-text-note); }
.skeleton-lines { display:grid;gap:.7rem; }
.skeleton-line { display:block;height:1rem;width:100%;border-radius:var(--radius-input);
  background:linear-gradient(100deg,var(--color-background-soft) 10%,var(--color-background-input) 45%,var(--color-background-soft) 80%);
  background-size:220% 100%;animation:skeleton-sweep 1.6s ease-in-out infinite;
}
.skeleton-line.short { width:65%; }
@keyframes skeleton-sweep { to { background-position-x:-220%; } }
@media (prefers-reduced-motion:reduce) { .skeleton-line { animation:none; } }
</style>
