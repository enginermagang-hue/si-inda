<script setup lang="ts">
import { api, type VisitorStats } from '~/composables/api'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const range = ref<'7d' | '30d' | '90d' | 'all'>('7d')
const rangeItems = [
  { label: '7 hari', value: '7d' },
  { label: '30 hari', value: '30d' },
  { label: '90 hari', value: '90d' },
  { label: 'Semua', value: 'all' },
]

const stats = ref<VisitorStats | null>(null)
const loading = ref(true)
const error = ref('')

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ data: VisitorStats }>(`/admin/visits/stats?range=${range.value}`)
    stats.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(range, load)

function fmt(n: number): string { return n.toLocaleString('id-ID') }
function fmtDate(d: string): string {
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) } catch { return d }
}

const maxHits = computed(() => Math.max(1, ...((stats.value?.daily ?? []).map(d => d.hits))))

function exportCsv(): void {
  window.open(`/api/admin/visits/export?range=${range.value}`, '_blank')
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Pengunjung</h1>
        <p class="mt-1 text-sm text-muted">Pantau trafik situs — hit, unique, online, halaman & referrer.</p>
      </div>
      <div class="flex items-center gap-2">
        <USelect v-model="range" :items="rangeItems" value-key="value" label-key="label" class="w-32" />
        <UButton icon="i-lucide-download" variant="outline" @click="exportCsv">Export CSV</UButton>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />
    <p v-if="loading" class="mt-6 text-sm text-muted">Memuat…</p>

    <template v-if="!loading && stats">
      <!-- 4 kartu ringkas -->
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UCard>
          <p class="text-sm text-muted">Total Hit</p>
          <p class="mt-1 text-2xl font-bold">{{ fmt(stats.total) }}</p>
          <p class="text-xs text-muted">Unique: {{ fmt(stats.uniquesTotal) }}</p>
        </UCard>
        <UCard>
          <p class="text-sm text-muted">Hari Ini</p>
          <p class="mt-1 text-2xl font-bold">{{ fmt(stats.today) }}</p>
          <p class="text-xs text-muted">Unique: {{ fmt(stats.todayUniques) }}</p>
        </UCard>
        <UCard>
          <p class="text-sm text-muted">Online (5 menit)</p>
          <p class="mt-1 text-2xl font-bold text-success">{{ fmt(stats.online) }}</p>
          <p class="text-xs text-muted">Visitor aktif</p>
        </UCard>
        <UCard>
          <p class="text-sm text-muted">Rata-rata / hari</p>
          <p class="mt-1 text-2xl font-bold">{{ stats.daily.length ? fmt(Math.round(stats.daily.reduce((a,c)=>a+c.hits,0)/stats.daily.length)) : '0' }}</p>
          <p class="text-xs text-muted">{{ stats.daily.length }} hari</p>
        </UCard>
      </div>

      <!-- Chart harian (bar sederhana) -->
      <UCard class="mt-4">
        <template #header>
          <p class="font-semibold">Trafik Harian</p>
        </template>
        <div v-if="!stats.daily.length" class="text-sm text-muted">Belum ada data.</div>
        <div v-else class="space-y-2">
          <div v-for="d in stats.daily" :key="d.date" class="flex items-center gap-3">
            <span class="w-14 shrink-0 text-xs text-muted">{{ fmtDate(d.date) }}</span>
            <div class="flex-1 h-6 bg-muted rounded overflow-hidden flex">
              <div class="bg-primary h-full" :style="{ width: `${(d.hits / maxHits * 100).toFixed(1)}%` }" />
            </div>
            <span class="w-20 text-right text-xs font-medium">{{ fmt(d.hits) }} <span class="text-muted">/ {{ fmt(d.uniques) }} uniq</span></span>
          </div>
        </div>
      </UCard>

      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <UCard>
          <template #header><p class="font-semibold">Top Halaman</p></template>
          <div v-if="!stats.topPages.length" class="text-sm text-muted">Belum ada data.</div>
          <ul v-else class="space-y-1.5">
            <li v-for="p in stats.topPages" :key="p.path" class="flex justify-between gap-2 text-sm">
              <span class="truncate text-muted">{{ p.path }}</span>
              <span class="shrink-0 font-medium">{{ fmt(p.hits) }}</span>
            </li>
          </ul>
        </UCard>
        <UCard>
          <template #header><p class="font-semibold">Top Referrer</p></template>
          <div v-if="!stats.topReferers.length" class="text-sm text-muted">Belum ada referrer.</div>
          <ul v-else class="space-y-1.5">
            <li v-for="r in stats.topReferers" :key="r.referer ?? 'null'" class="flex justify-between gap-2 text-sm">
              <span class="truncate text-muted">{{ r.referer || '-' }}</span>
              <span class="shrink-0 font-medium">{{ fmt(r.hits) }}</span>
            </li>
          </ul>
        </UCard>
      </div>

      <UCard v-if="stats.topCountries.length" class="mt-4">
        <template #header><p class="font-semibold">Top Negara</p></template>
        <ul class="flex flex-wrap gap-2">
          <li v-for="c in stats.topCountries" :key="c.country ?? 'null'">
            <UBadge variant="soft">{{ c.country || 'Unknown' }}: {{ fmt(c.hits) }}</UBadge>
          </li>
        </ul>
      </UCard>

      <UCard class="mt-4">
        <template #header><p class="font-semibold">Kunjungan Terbaru (50)</p></template>
        <div v-if="!stats.recent.length" class="text-sm text-muted">Belum ada data.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-xs text-muted border-b border-default">
              <tr>
                <th class="text-left py-1.5 pr-2">Waktu</th>
                <th class="text-left py-1.5 pr-2">Path</th>
                <th class="text-left py-1.5 pr-2">IP</th>
                <th class="text-left py-1.5">Referrer</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in stats.recent" :key="r.id" class="border-b border-default/50">
                <td class="py-1.5 pr-2 whitespace-nowrap text-xs text-muted">{{ new Date(r.createdAt).toLocaleString('id-ID') }}</td>
                <td class="py-1.5 pr-2 truncate max-w-[200px]">{{ r.path }}</td>
                <td class="py-1.5 pr-2 text-xs">{{ r.ip || '-' }} <span v-if="r.country" class="text-muted">({{ r.country }})</span></td>
                <td class="py-1.5 truncate max-w-[180px] text-xs text-muted">{{ r.referer || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </div>
</template>
