<script setup lang="ts">
import type { Letter } from '~/composables/api'

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

const { data: res } = await useFetch<{ data: Letter[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/api/letters', {
  query: computed(() => {
    const base: Record<string, string | number> = { page: page.value, limit: LIMIT }
    const trimmed = qDebounced.value.trim()
    if (trimmed) base.q = trimmed
    return base
  }),
  default: () => ({ data: [] as Letter[], meta: { total: 0, page: 1, limit: LIMIT, totalPages: 1 } }),
})

const letters = computed(() => res.value.data)
const total = computed(() => res.value.meta.total)

watch(total, (t) => {
  const max = Math.max(1, Math.ceil(t / LIMIT))
  if (page.value > max) page.value = max
})

watch(() => res.value.meta.page, (serverPage) => {
  if (serverPage !== page.value) page.value = serverPage
})

function fileUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : `/${path}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function onPageChange(p: number): void {
  page.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">Informasi</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Surat Informasi Dapodik</h1>
    <p class="mt-1 text-sm text-muted">Surat edaran dan pemberitahuan resmi terkait pendataan Dapodik.</p>

    <div class="mt-4 flex gap-2">
      <UInput v-model="q" icon="i-lucide-search" placeholder="Cari surat…" class="flex-1" @update:model-value="onSearchInput" />
      <UButton v-if="q" variant="ghost" color="neutral" icon="i-lucide-x" @click="clearSearch">Bersihkan</UButton>
    </div>
    <p v-if="qDebounced.trim()" class="mt-2 text-xs text-muted">
      {{ total }} hasil untuk "{{ qDebounced.trim() }}"
    </p>

    <div v-if="letters.length" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="letter in letters" :key="letter.id" variant="outline" class="flex flex-col">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <UIcon name="i-lucide-file-text" class="text-lg text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium uppercase tracking-wide text-muted line-clamp-1">
                {{ letter.nomorSurat }}
              </p>
              <p class="text-xs text-muted">{{ formatDate(letter.tanggalSurat) }}</p>
            </div>
          </div>
          <UButton
            v-if="letter.filePath"
            :to="fileUrl(letter.filePath)"
            target="_blank"
            icon="i-lucide-download"
            size="xs"
            variant="soft"
            class="shrink-0"
          >
            Unduh PDF
          </UButton>
          <span v-else class="shrink-0 whitespace-nowrap text-xs text-muted">Tanpa lampiran</span>
        </div>

        <h2 class="mt-3 font-semibold line-clamp-2">{{ letter.judul }}</h2>
        <p v-if="letter.deskripsi" class="mt-2 text-sm text-muted line-clamp-3">{{ letter.deskripsi }}</p>
      </UCard>
    </div>
    <UEmpty
      v-else
      :title="qDebounced.trim() ? 'Tidak ada hasil' : 'Belum ada surat'"
      :description="qDebounced.trim() ? `Tidak ada surat untuk '${qDebounced.trim()}'` : 'Belum ada surat yang dipublikasikan.'"
      class="mt-6"
    />

    <div v-if="total > LIMIT" class="mt-6 flex justify-center">
      <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" :sibling-count="1" show-edges @update:page="onPageChange" />
    </div>
  </div>
</template>
