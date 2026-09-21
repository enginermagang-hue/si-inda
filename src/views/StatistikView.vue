<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, STAT_META, type Statistic } from '@/lib/api'

const route = useRoute()
const rows = ref<Statistic[]>([])
const loading = ref(true)
const error = ref('')

const category = computed(() => {
  const map: Record<string, Statistic['category']> = {
    'satuan-pendidikan': 'satuan_pendidikan',
    'peserta-didik': 'peserta_didik',
    guru: 'guru',
    tendik: 'tendik',
  }
  return map[route.params.category as string]
})

const meta = computed(() => (category.value ? STAT_META[category.value] : null))

async function load(): Promise<void> {
  if (!category.value) {
    error.value = 'Kategori statistik tidak dikenal.'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ data: Statistic[] }>(`/statistics?category=${category.value}`)
    rows.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat data.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.category, load)

const total = computed(() => rows.value.reduce((s, r) => s + r.value, 0))

function formatNum(n: number): string {
  return n.toLocaleString('id-ID')
}
</script>

<template>
  <div>
    <p class="text-sm text-slate-500">Statistik Dapodik</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{{ meta?.title ?? 'Statistik' }}</h1>
    <p class="mt-1 text-sm text-slate-500">{{ meta?.subtitle }} periode {{ rows[0]?.period ?? '-' }}.</p>

    <p v-if="loading" class="mt-6 text-sm text-slate-500">Memuat data…</p>
    <p v-else-if="error" class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</p>
    <div v-else>
      <div class="mt-6 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-600 p-6 text-white sm:p-8">
        <p class="text-sm text-emerald-100">Total {{ meta?.title }}</p>
        <p class="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{{ formatNum(total) }}</p>
        <p class="mt-1 text-sm text-emerald-100">Periode {{ rows[0]?.period ?? '-' }}</p>
      </div>

      <div v-if="rows.length > 1 || (rows.length === 1 && rows[0]?.jenjang)" class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="px-4 py-3 font-medium">Rincian</th>
              <th v-if="rows.some((r) => r.jenjang)" class="px-4 py-3 font-medium">Jenjang</th>
              <th class="px-4 py-3 text-right font-medium">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-t border-slate-100">
              <td class="px-4 py-3 font-medium">{{ row.label }}</td>
              <td v-if="rows.some((r) => r.jenjang)" class="px-4 py-3 text-slate-500">{{ row.jenjang ?? '-' }}</td>
              <td class="px-4 py-3 text-right font-bold text-emerald-700">{{ formatNum(row.value) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="!rows.length" class="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Data periode aktif belum diisi admin.
      </p>
    </div>
  </div>
</template>
