<script setup lang="ts">
const { t } = useUiLocale();
const { data: auth } = await useFetch<{ authenticated:boolean;configured:boolean }>('/api/auth/me');
</script>
<template>
  <div><TopicPath :items="[{label:t('home'),to:'/'},{label:t('loginTitle')}]" />
    <ReaderPanel><h1>{{ t('loginTitle') }}</h1>
      <NuxtLink v-if="auth?.authenticated" to="/admin">{{ t('adminHome') }}</NuxtLink>
      <template v-else><p>{{ t('studioLoginRequired') }}</p>
        <a href="/api/auth/discord" class="inline-action">{{ t('studioDiscordLogin') }}</a>
      </template>
    </ReaderPanel>
  </div>
</template>
