<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api, type NewsItem } from '@/lib/api'

const items = ref<NewsItem[]>([])

onMounted(async () => {
  try {
    const res = await api.get<{ data: NewsItem[] }>('/breaking-news')
    items.value = res.data.slice(0, 5)
  } catch {
    items.value = []
  }
})
</script>

<template>
  <div v-if="items.length" class="bg-emerald-700 text-white">
    <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
      <span class="shrink-0 rounded bg-white/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
        Breaking News
      </span>
      <div class="relative flex-1 overflow-hidden">
        <div class="ticker flex w-max gap-12 whitespace-nowrap text-sm">
          <RouterLink
            v-for="item in items"
            :key="item.id"
            to="/informasi/berita"
            class="hover:underline"
          >
            • {{ item.title }}
          </RouterLink>
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
