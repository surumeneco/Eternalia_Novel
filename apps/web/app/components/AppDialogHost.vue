<script setup lang="ts">
const { t } = useUiLocale();
const { current, resolve } = useAppDialog();
const dialog = ref<HTMLDialogElement | null>(null);
watch(current, async request => {
  await nextTick();
  if (request && !dialog.value?.open) dialog.value?.showModal();
  else if (!request && dialog.value?.open) dialog.value?.close();
}, { immediate: true });
function cancel(event: Event) {
  event.preventDefault();
  resolve(false);
}
onBeforeUnmount(() => { if (current.value) resolve(false); });
</script>
<template>
  <dialog ref="dialog" class="eternalia-dialog" aria-labelledby="dialog-message" @cancel="cancel" @close="resolve(false)">
    <p id="dialog-message">{{ current?.message }}</p>
    <div class="dialog-actions">
      <button type="button" class="inline-action" @click="resolve(false)">{{ t('dialogCancel') }}</button>
      <button type="button" class="inline-action dialog-confirm" @click="resolve(true)">{{ t('dialogAccept') }}</button>
    </div>
  </dialog>
</template>
<style scoped>
.eternalia-dialog { width:min(32rem,calc(100vw - 2rem)); padding:1.5rem; border:1px solid var(--color-border-base);
  border-radius:var(--radius-panel); background:var(--color-background-base); color:var(--color-text-base); box-shadow:0 20px 60px #0009; }
.eternalia-dialog::backdrop { background:#0009; }
.dialog-actions { display:flex; justify-content:flex-end; gap:.8rem; margin-top:1.5rem; }
.dialog-confirm { border-color:var(--color-concept-main); }
</style>
