<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type InfoLink } from '@/lib/api'

const links = ref<InfoLink[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get<{ data: InfoLink[] }>('/links')
    links.value = res.data
  } catch {
    links.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <p class="text-sm text-slate-500">Informasi</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Link Informasi Dapodik</h1>
    <p class="mt-1 text-sm text-slate-500">Tautan penting aplikasi dan layanan pendataan.</p>

    <p v-if="loading" class="mt-6 text-sm text-slate-500">Memuat data…</p>
    <div v-else-if="links.length" class="mt-6 grid gap-3 sm:grid-cols-2">
      <a
        v-for="link in links"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noopener"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <p class="font-semibold text-emerald-700">🔗 {{ link.title }}</p>
        <p class="mt-1 break-all text-xs text-slate-400">{{ link.url }}</p>
      </a>
    </div>
    <p v-else class="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      Belum ada link yang dipublikasikan.
    </p>
  </div>
</template>
