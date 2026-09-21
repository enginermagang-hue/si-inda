<script setup lang="ts">
import type { NewsItem } from '~/composables/api'

const { data: res } = await useFetch<{ data: NewsItem[] }>('/api/breaking-news', {
  default: () => ({ data: [] as NewsItem[] }),
})
const items = computed(() => res.value.data)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">Informasi</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Breaking News</h1>
    <p class="mt-1 text-sm text-muted">Kabar terbaru seputar pendataan Dapodik.</p>

    <div v-if="items.length" class="mt-6 space-y-3">
      <UCard v-for="item in items" :key="item.id">
        <p class="text-xs text-muted">{{ formatDate(item.publishedAt) }}</p>
        <h2 class="mt-1 font-semibold">{{ item.title }}</h2>
        <p v-if="item.body" class="mt-1 text-sm text-muted">{{ item.body }}</p>
      </UCard>
    </div>
    <UEmpty v-else title="Belum ada berita" description="Belum ada berita aktif." class="mt-6" />
  </div>
</template>
