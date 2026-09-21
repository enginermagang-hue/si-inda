<script setup lang="ts">
import { STAT_META, type Statistic } from '~/composables/api'

const route = useRoute()
const map: Record<string, Statistic['category']> = {
  'satuan-pendidikan': 'satuan_pendidikan',
  'peserta-didik': 'peserta_didik',
  guru: 'guru',
  tendik: 'tendik',
}
const category = computed(() => map[route.params.category as string])
const meta = computed(() => (category.value ? STAT_META[category.value] : null))

const { data: res, error } = await useFetch<{ data: Statistic[] }>(
  () => `/api/statistics?category=${category.value}`,
  {
    default: () => ({ data: [] as Statistic[] }),
    watch: [() => route.params.category],
  },
)
const rows = computed(() => res.value.data)

if (!category.value) {
  throw createError({ statusCode: 404, message: 'Kategori statistik tidak dikenal.' })
}

const total = computed(() => rows.value.reduce((s, r) => s + r.value, 0))

function formatNum(n: number): string {
  return n.toLocaleString('id-ID')
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">Statistik Dapodik</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{{ meta?.title ?? 'Statistik' }}</h1>
    <p class="mt-1 text-sm text-muted">{{ meta?.subtitle }} periode {{ rows[0]?.period ?? '-' }}.</p>

    <UAlert v-if="error" color="error" variant="soft" title="Gagal memuat data." class="mt-6" />
    <template v-else>
      <UCard class="mt-6 bg-primary text-white" variant="solid">
        <p class="text-sm opacity-80">Total {{ meta?.title }}</p>
        <p class="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{{ formatNum(total) }}</p>
        <p class="mt-1 text-sm opacity-80">Periode {{ rows[0]?.period ?? '-' }}</p>
      </UCard>

      <UTable
        v-if="rows.length > 1 || (rows.length === 1 && rows[0]?.jenjang)"
        :data="rows"
        :columns="[
          { accessorKey: 'label', header: 'Rincian' },
          ...(rows.some((r) => r.jenjang) ? [{ accessorKey: 'jenjang', header: 'Jenjang' }] : []),
          { accessorKey: 'value', header: 'Jumlah' },
        ]"
        class="mt-6"
      >
        <template #value-cell="{ row }">
          <span class="font-bold text-primary">{{ formatNum(row.original.value) }}</span>
        </template>
      </UTable>
      <p v-else-if="!rows.length" class="mt-6 rounded-xl border border-default bg-default p-6 text-sm text-muted">
        Data periode aktif belum diisi admin.
      </p>
    </template>
  </div>
</template>
