<script setup lang="ts">
import { useSiteStore } from '~/stores/site'

const site = useSiteStore()

await site.load()

const initial = computed(() => site.settings.site_name.charAt(0).toUpperCase())
</script>

<template>
  <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
    {{ initial }}
  </span>
</template>
