<script setup lang="ts">const route=useRoute();const {t}=useUiLocale();</script>
<template><div><AdminPublicationPage :key="String(route.params.id)" /></div></template>
