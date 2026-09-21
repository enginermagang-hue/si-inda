<script setup lang="ts">
import type { NewsItem } from '~/composables/api'

const { data: res } = await useFetch<{ data: NewsItem[] }>('/api/breaking-news', {
  default: () => ({ data: [] as NewsItem[] }),
})
const items = computed(() => res.value.data.slice(0, 5))
</script>

<template>
  <div v-if="items.length" class="bg-primary text-white">
    <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
      <UBadge color="neutral" variant="solid" class="shrink-0 bg-white/20 text-white">
        Breaking News
      </UBadge>
      <div class="relative flex-1 overflow-hidden">
        <div class="ticker flex w-max gap-12 whitespace-nowrap text-sm">
          <NuxtLink v-for="item in items" :key="item.id" to="/informasi/berita" class="hover:underline">
            • {{ item.title }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  animation: ticker 30s linear infinite;
}
.ticker:hover {
  animation-play-state: paused;
}
@keyframes ticker {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>
