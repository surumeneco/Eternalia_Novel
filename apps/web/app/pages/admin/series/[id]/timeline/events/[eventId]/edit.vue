<script setup lang="ts">const route=useRoute();const {t}=useUiLocale();</script>
<template><div><AdminEditBridge :series-id="String(route.params.id)" :node-id="String(route.params.eventId)" kind="event" /></div></template>
