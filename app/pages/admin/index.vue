<script setup lang="ts">
import { api, type Complaint } from '~/composables/api'

definePageMeta({ layout: 'admin', middleware: 'admin' })

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

const cards = computed(() => [
  { label: 'Baris Statistik', value: counts.value.statistik, to: '/admin/statistik' },
  { label: 'Halaman Syarat', value: counts.value.halaman, to: '/admin/halaman' },
  { label: 'Surat Informasi', value: counts.value.surat, to: '/admin/surat' },
  { label: 'Link Informasi', value: counts.value.link, to: '/admin/link' },
  { label: 'Breaking News', value: counts.value.berita, to: '/admin/berita' },
  { label: 'Pengaduan Baru', value: counts.value.baru, to: '/admin/pengaduan', alert: counts.value.baru > 0 },
])
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
    <p class="mt-1 text-sm text-muted">Ringkasan konten microsite.</p>
    <p v-if="loading" class="mt-6 text-sm text-muted">Memuat…</p>
    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UPageCard
        v-for="card in cards"
        :key="card.label"
        :title="card.label"
        :to="card.to"
        variant="outline"
        :highlight="card.alert"
      >
        <p class="text-3xl font-bold" :class="card.alert ? 'text-error' : ''">{{ card.value }}</p>
      </UPageCard>
    </div>
    <UAlert
      v-if="!loading && counts.diproses > 0"
      color="warning"
      variant="soft"
      :title="`${counts.diproses} pengaduan sedang diproses.`"
      class="mt-4"
    />
  </div>
</template>
