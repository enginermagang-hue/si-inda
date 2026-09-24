<script setup lang="ts">
import type { Sop } from '~/composables/api'

const route = useRoute()
const router = useRouter()

const LIMIT = 9

const page = ref(Math.max(1, Number(route.query.page) || 1))
const q = ref(typeof route.query.q === 'string' ? route.query.q : '')
const qDebounced = ref(q.value)
let debounce: ReturnType<typeof setTimeout> | null = null

function syncQuery(): void {
  const query: Record<string, string> = { ...route.query as Record<string, string> }
  if (page.value <= 1) delete query.page
  else query.page = String(page.value)
  const trimmed = qDebounced.value.trim()
  if (trimmed) query.q = trimmed
  else delete query.q
  const cur = route.query as Record<string, string | undefined>
  if (cur.page !== query.page || cur.q !== query.q) router.replace({ query })
}

watch(() => route.query.page, (val) => {
  const n = Math.max(1, Number(val) || 1)
  if (n !== page.value) page.value = n
})

watch(() => route.query.q, (val) => {
  const v = typeof val === 'string' ? val : ''
  if (v !== q.value) q.value = v
  if (v !== qDebounced.value) qDebounced.value = v
})

watch(page, syncQuery)
watch(qDebounced, () => {
  page.value = 1
  syncQuery()
})

function onSearchInput(): void {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => { qDebounced.value = q.value }, 350)
}

function clearSearch(): void {
  if (debounce) clearTimeout(debounce)
  q.value = ''
  qDebounced.value = ''
}

const { data: res } = await useFetch<{ data: Sop[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/api/sops', {
  query: computed(() => {
    const base: Record<string, string | number> = { page: page.value, limit: LIMIT }
    const trimmed = qDebounced.value.trim()
    if (trimmed) base.q = trimmed
    return base
  }),
  default: () => ({ data: [] as Sop[], meta: { total: 0, page: 1, limit: LIMIT, totalPages: 1 } }),
})
const items = computed(() => res.value.data)
const total = computed(() => res.value.meta.total)

watch(total, (t) => {
  const max = Math.max(1, Math.ceil(t / LIMIT))
  if (page.value > max) page.value = max
})

watch(() => res.value.meta.page, (serverPage) => {
  if (serverPage !== page.value) page.value = serverPage
})

const active = ref<Sop | null>(null)
const modalOpen = computed({
  get: () => active.value !== null,
  set: (v: boolean) => { if (!v) active.value = null },
})

function imgUrl(path: string | null): string {
  if (!path) return ''
  return /^https?:\/\//i.test(path) ? path : `/${path}`
}

function onPageChange(p: number): void {
  page.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">Layanan</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">SOP Pelayanan Dapodik</h1>
    <p class="mt-1 text-sm text-muted">Standar Operasional Prosedur pelayanan pendataan Dapodik.</p>

    <div class="mt-4 flex gap-2">
      <UInput v-model="q" icon="i-lucide-search" placeholder="Cari SOP…" class="flex-1" @update:model-value="onSearchInput" />
      <UButton v-if="q" variant="ghost" color="neutral" icon="i-lucide-x" @click="clearSearch">Bersihkan</UButton>
    </div>
    <p v-if="qDebounced.trim()" class="mt-2 text-xs text-muted">
      {{ total }} hasil untuk "{{ qDebounced.trim() }}"
    </p>

    <div v-if="items.length" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="sop in items" :key="sop.id" class="overflow-hidden">
        <button class="block w-full cursor-pointer" @click="active = sop">
          <img v-if="sop.filePath" :src="imgUrl(sop.filePath)" :alt="sop.judul" class="aspect-[4/3] w-full object-cover" loading="lazy">
        </button>
        <div class="p-4">
          <h2 class="font-semibold">{{ sop.judul }}</h2>
          <p v-if="sop.deskripsi" class="mt-1 text-sm text-muted">{{ sop.deskripsi }}</p>
          <UButton v-if="sop.filePath" :to="imgUrl(sop.filePath)" target="_blank" variant="soft" size="sm" class="mt-3">Lihat ukuran penuh</UButton>
        </div>
      </UCard>
    </div>
    <UEmpty
      v-else
      :title="qDebounced.trim() ? 'Tidak ada hasil' : 'Belum ada SOP'"
      :description="qDebounced.trim() ? `Tidak ada SOP untuk '${qDebounced.trim()}'` : 'Belum ada SOP yang dipublikasikan.'"
      class="mt-6"
    />

    <div v-if="total > LIMIT" class="mt-6 flex justify-center">
      <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" :sibling-count="1" show-edges @update:page="onPageChange" />
    </div>

    <UModal v-model:open="modalOpen" :title="active?.judul">
      <template #body>
        <img v-if="active?.filePath" :src="imgUrl(active.filePath)" :alt="active.judul" class="w-full rounded-md">
        <p v-if="active?.deskripsi" class="mt-3 text-sm text-muted">{{ active.deskripsi }}</p>
      </template>
    </UModal>
  </div>
</template>
