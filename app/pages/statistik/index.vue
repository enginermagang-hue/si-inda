<script setup lang="ts">
import { STAT_META, type Statistic } from '~/composables/api'
import { STAT_CATEGORIES } from '~/../server/utils/validate'

const { data: res, error } = await useFetch<{ data: Statistic[] }>('/api/statistics', {
  default: () => ({ data: [] as Statistic[] }),
})

const rows = computed(() => res.value.data)

function rowsFor(cat: Statistic['category']): Statistic[] {
  return rows.value.filter((r) => r.category === cat)
}

function totalFor(cat: Statistic['category']): number {
  return rowsFor(cat).reduce((s, r) => s + r.value, 0)
}

function periodFor(cat: Statistic['category']): string {
  return rowsFor(cat)[0]?.period ?? '-'
}

function formatNum(n: number): string {
  return n.toLocaleString('id-ID')
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">Statistik Dapodik</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Statistik Dapodik</h1>
    <p class="mt-1 text-sm text-muted">Rekap angka Dapodik periode aktif per kategori.</p>

    <UAlert v-if="error" color="error" variant="soft" title="Gagal memuat data." class="mt-6" />

    <template v-else>
      <p v-if="!rows.length" class="mt-6 rounded-xl border border-default bg-default p-6 text-sm text-muted">
        Data periode aktif belum diisi admin.
      </p>

      <div v-else class="mt-6 space-y-8">
        <section v-for="cat in STAT_CATEGORIES" :key="cat">
          <h2 class="text-lg font-bold tracking-tight">{{ STAT_META[cat].title }}</h2>
          <p class="mt-1 text-sm text-muted">{{ STAT_META[cat].subtitle }} — periode {{ periodFor(cat) }}.</p>

          <UCard class="mt-3 bg-primary text-white" variant="solid">
            <p class="text-sm opacity-80">Total {{ STAT_META[cat].title }}</p>
            <p class="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{{ formatNum(totalFor(cat)) }}</p>
            <p class="mt-1 text-sm opacity-80">Periode {{ periodFor(cat) }}</p>
          </UCard>

          <template v-if="rowsFor(cat).length">
            <UTable
              v-if="rowsFor(cat).length > 1 || (rowsFor(cat).length === 1 && rowsFor(cat)[0]?.jenjang)"
              :data="rowsFor(cat)"
              :columns="[
                { accessorKey: 'label', header: 'Rincian' },
                ...(rowsFor(cat).some((r) => r.jenjang) ? [{ accessorKey: 'jenjang', header: 'Jenjang' }] : []),
                { accessorKey: 'value', header: 'Jumlah' },
              ]"
              class="mt-4"
            >
              <template #value-cell="{ row }">
                <span class="font-bold text-primary">{{ formatNum(row.original.value) }}</span>
              </template>
            </UTable>
          </template>
          <p v-else class="mt-4 rounded-xl border border-default bg-default p-4 text-sm text-muted">
            Data {{ STAT_META[cat].title }} belum tersedia.
          </p>
        </section>
      </div>
    </template>
  </div>
</template>
