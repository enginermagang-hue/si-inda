<script setup lang="ts">
import { STAT_CATEGORIES } from '~/../server/utils/validate'
import { STAT_META } from '~/composables/api'

const { data: res, error, refresh } = await useFetch<{ data: any[]; categories: string[]; period: string; updated_at: string }>('/api/statistics', {
  default: () => ({ data: [], categories: [], period: '-', updated_at: '' }),
})

const statisticsData = computed(() => res.value?.data || [])
const period = computed(() => res.value?.period || '-')

function getCategoryData(category: typeof STAT_CATEGORIES[number]): any[] {
  return statisticsData.value.filter((d) => d.category === category && d.jenjang !== null)
}

function getCategoryTotal(category: typeof STAT_CATEGORIES[number]): number {
  const totalRow = statisticsData.value.find((d) => d.category === category && d.jenjang === null)
  if (totalRow) return totalRow.value || 0
  return getCategoryData(category).reduce((sum, d) => sum + (d.value || 0), 0)
}

function formatNum(n: number): string {
  return n.toLocaleString('id-ID')
}

// Refresh on mount and when navigating back
onMounted(() => {
  refresh()
})
</script>

<template>
  <div>
    <p class="text-sm text-muted">Statistik Dapodik</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Statistik Dapodik</h1>
    <p class="mt-1 text-sm text-muted">Rekap angka Dapodik periode {{ period }} per kategori.</p>
    <p v-if="res?.updated_at" class="mt-1 text-xs text-muted">
      Data terakhir diupdate: {{ new Date(res.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
    </p>

    <UAlert v-if="error" color="error" variant="soft" title="Gagal memuat data." class="mt-6" />

    <template v-else>
      <p v-if="!Object.keys(statisticsData).length" class="mt-6 rounded-xl border border-default bg-default p-6 text-sm text-muted">
        Data periode belum diisi admin.
      </p>

      <div v-else class="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
        <UCard
          v-for="cat in STAT_CATEGORIES"
          :key="cat"
          class="flex flex-col"
        >
          <template #header>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-bold">{{ STAT_META[cat].title }}</h3>
                <p class="mt-1 text-sm text-muted">{{ STAT_META[cat].subtitle }} — periode {{ period }}.</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-muted">Total</p>
                <p class="text-2xl font-bold text-primary">
                  {{ formatNum(getCategoryTotal(cat)) }}
                </p>
              </div>
            </div>
          </template>

          <GuruDonutChart
            v-if="cat === 'guru'"
            :data="getCategoryData(cat)"
          />

          <StatisticsChart
            v-else-if="getCategoryData(cat).length > 0"
            :category="cat"
            :data="getCategoryData(cat)"
            class="flex-1"
          />

          <p v-else class="py-8 text-center text-muted">
            Data {{ STAT_META[cat].title }} belum tersedia.
          </p>
        </UCard>
      </div>
    </template>
  </div>
</template>