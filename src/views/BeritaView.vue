<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type NewsItem } from '@/lib/api'

const items = ref<NewsItem[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get<{ data: NewsItem[] }>('/breaking-news')
    items.value = res.data
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div>
    <p class="text-sm text-slate-500">Informasi</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Breaking News</h1>
    <p class="mt-1 text-sm text-slate-500">Kabar terbaru seputar pendataan Dapodik.</p>

    <p v-if="loading" class="mt-6 text-sm text-slate-500">Memuat data…</p>
    <div v-else-if="items.length" class="mt-6 space-y-3">
      <article v-for="item in items" :key="item.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs text-slate-400">{{ formatDate(item.publishedAt) }}</p>
        <h2 class="mt-1 font-semibold">{{ item.title }}</h2>
        <p v-if="item.body" class="mt-1 text-sm text-slate-600">{{ item.body }}</p>
      </article>
    </div>
    <p v-else class="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      Belum ada berita aktif.
    </p>
  </div>
</template>
