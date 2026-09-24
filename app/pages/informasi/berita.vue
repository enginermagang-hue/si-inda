<script setup lang="ts">
import type { NewsItem, NewsImage } from '~/composables/api'

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

const { data: res } = await useFetch<{ data: NewsItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/api/breaking-news', {
  query: computed(() => {
    const base: Record<string, string | number> = { page: page.value, limit: LIMIT }
    const trimmed = qDebounced.value.trim()
    if (trimmed) base.q = trimmed
    return base
  }),
  default: () => ({ data: [] as NewsItem[], meta: { total: 0, page: 1, limit: LIMIT, totalPages: 1 } }),
})

const items = computed(() => res.value.data)
// server already sorts desc(publishedAt), keep as-is (newest first)
const total = computed(() => res.value.meta.total)

watch(total, (t) => {
  const max = Math.max(1, Math.ceil(t / LIMIT))
  if (page.value > max) page.value = max
})

watch(() => res.value.meta.page, (serverPage) => {
  if (serverPage !== page.value) page.value = serverPage
})

const lightboxOpen = ref(false)
const lightboxImages = ref<NewsImage[]>([])
const lightboxIndex = ref(0)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function viewImage(images: NewsImage[], index: number): void {
  lightboxImages.value = images
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function onPageChange(p: number): void {
  page.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">Informasi</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Breaking News</h1>
    <p class="mt-1 text-sm text-muted">Kabar terbaru seputar pendataan Dapodik.</p>

    <div class="mt-4 flex gap-2">
      <UInput v-model="q" icon="i-lucide-search" placeholder="Cari berita…" class="flex-1" @update:model-value="onSearchInput" />
      <UButton v-if="q" variant="ghost" color="neutral" icon="i-lucide-x" @click="clearSearch">Bersihkan</UButton>
    </div>
    <p v-if="qDebounced.trim()" class="mt-2 text-xs text-muted">
      {{ total }} hasil untuk "{{ qDebounced.trim() }}"
    </p>

    <div v-if="items.length" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="item in items" :key="item.id" class="flex flex-col overflow-hidden">
        <div class="flex-1 min-w-0">
          <div
            v-if="item.images[0]?.filePath"
            class="mb-3 aspect-[3/2] w-full overflow-hidden rounded"
          >
            <img
              :src="item.images[0].filePath"
              :alt="item.images[0].description || item.title"
              class="size-full object-cover"
              loading="lazy"
            >
          </div>
          <div
            v-else
            class="mb-3 flex aspect-[3/2] w-full items-center justify-center rounded bg-elevated/50"
          >
            <UIcon name="i-lucide-image" class="size-10 text-dimmed" />
          </div>
          <p class="text-xs text-muted">{{ formatDate(item.publishedAt) }}</p>
          <h2 class="mt-1 font-semibold line-clamp-2">{{ item.title }}</h2>
          <p v-if="item.body" class="mt-1 text-sm text-muted line-clamp-3">{{ item.body }}</p>
        </div>

        <div v-if="(item.images ?? []).length" class="mt-3 grid gap-2 grid-cols-2">
          <div
            v-for="(img, i) in (item.images ?? []).slice(0, 4)"
            :key="img.id"
            class="relative rounded-lg overflow-hidden bg-elevated/50 group cursor-pointer"
            @click="viewImage(item.images ?? [], i)"
          >
            <img
              :src="img.filePath ?? ''"
              class="w-full h-28 object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            >
            <div
              v-if="i === 3 && (item.images?.length ?? 0) > 4"
              class="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold text-sm"
            >
              +{{ (item.images!.length - 4) }}
            </div>
            <div
              v-if="!(i === 3 && (item.images?.length ?? 0) > 4)"
              class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <UIcon name="i-lucide-zoom-in" class="text-white text-xl" />
            </div>
          </div>
        </div>
        <p v-if="(item.images?.length ?? 0) > 4" class="mt-2 text-xs text-muted text-center">{{ item.images!.length }} gambar — klik untuk lihat semua</p>
      </UCard>
    </div>
    <UEmpty
      v-else
      :title="qDebounced.trim() ? 'Tidak ada hasil' : 'Belum ada berita'"
      :description="qDebounced.trim() ? `Tidak ada berita untuk '${qDebounced.trim()}'` : 'Belum ada berita aktif.'"
      class="mt-6"
    />

    <div v-if="total > LIMIT" class="mt-6 flex justify-center">
      <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" :sibling-count="1" show-edges @update:page="onPageChange" />
    </div>

    <NewsImageLightbox v-model:open="lightboxOpen" :images="lightboxImages" :initial-index="lightboxIndex" />
  </div>
</template>
