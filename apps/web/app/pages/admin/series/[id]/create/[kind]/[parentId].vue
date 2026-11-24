<script setup lang="ts">
import StudioEditor from '~/pages/studio.vue';
const route=useRoute();
const target=computed(()=>({seriesId:String(route.params.id),kind:String(route.params.kind),parentId:String(route.params.parentId)}));
</script>
<template><StudioEditor :key="JSON.stringify(target)" :canonical-create="target" /></template>
