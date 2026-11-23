<script setup lang="ts">const route=useRoute();const {t}=useUiLocale();</script>
<template><div><AdminChapterPreview :series-id="String(route.params.id)" :chapter-id="String(route.params.chapterId)" /></div></template>
