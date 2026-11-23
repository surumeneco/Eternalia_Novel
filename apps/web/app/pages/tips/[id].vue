<script setup lang="ts">
const route=useRoute();
await navigateTo('/series/'+encodeURIComponent(String(route.params.id))+'/settings', {replace:true,redirectCode:301});
</script>
<template><div /></template>
