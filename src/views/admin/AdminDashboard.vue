<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api, STAT_META, type Complaint } from '@/lib/api'

const counts = ref({ statistik: 0, halaman: 0, surat: 0, link: 0, berita: 0, baru: 0, diproses: 0 })
const loading = ref(true)

onMounted(async () => {
  try {
    const [s, p, l, li, n, c] = await Promise.all([
      api.get<{ data: unknown[] }>('/admin/statistics'),
      api.get<{ data: unknown[] }>('/admin/pages'),
      api.get<{ data: unknown[] }>('/admin/letters'),
      api.get<{ data: unknown[] }>('/admin/links'),
      api.get<{ data: unknown[] }>('/admin/news'),
      api.get<{ data: Complaint[] }>('/admin/complaints'),
    ])
    counts.value = {
      statistik: s.data.length,
      halaman: p.data.length,
      surat: l.data.length,
      link: li.data.length,
      berita: n.data.length,
      baru: c.data.filter((x) => x.status === 'baru').length,
      diproses: c.data.filter((x) => x.status === 'diproses').length,
    }
  } catch {
    // biarkan nol bila API gagal
  } finally {
    loading.value = false
  }
})

const cards = [
  { label: 'Baris Statistik', value: () => counts.value.statistik, to: '/admin/statistik' },
  { label: 'Halaman Syarat', value: () => counts.value.halaman, to: '/admin/halaman' },
  { label: 'Surat Informasi', value: () => counts.value.surat, to: '/admin/surat' },
  { label: 'Link Informasi', value: () => counts.value.link, to: '/admin/link' },
  { label: 'Breaking News', value: () => counts.value.berita, to: '/admin/berita' },
  { label: 'Pengaduan Baru', value: () => counts.value.baru, to: '/admin/pengaduan', alert: true },
]
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
    <p class="mt-1 text-sm text-slate-500">Ringkasan konten microsite. Kategori statistik: {{ Object.keys(STAT_META).length }} (satuan pendidikan, peserta didik, guru, tendik).</p>
    <p v-if="loading" class="mt-6 text-sm text-slate-500">Memuat…</p>
    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="card in cards"
        :key="card.label"
        :to="card.to"
        class="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        :class="card.alert && card.value() > 0 ? 'border-red-300' : 'border-slate-200'"
      >
        <p class="text-sm text-slate-500">{{ card.label }}</p>
        <p class="mt-1 text-3xl font-bold" :class="card.alert && card.value() > 0 ? 'text-red-600' : 'text-slate-900'">
          {{ card.value() }}
        </p>
      </RouterLink>
    </div>
    <div v-if="!loading && counts.diproses > 0" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      {{ counts.diproses }} pengaduan sedang diproses.
    </div>
  </div>
</template>
