<script setup lang="ts">
import type { NewsItem, NewsImage } from '~/composables/api'

const route = useRoute()
const router = useRouter()

const LIMIT = 9

const page = ref(Math.max(1, Number(route.query.page) || 1))

watch(() => route.query.page, (val) => {
  const n = Math.max(1, Number(val) || 1)
  if (n !== page.value) page.value = n
})

watch(page, (p) => {
  const q = { ...route.query }
  if (p <= 1) delete q.page
  else q.page = String(p)
  router.replace({ query: q })
})

const { data: res } = await useFetch<{ data: NewsItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/api/breaking-news', {
  query: computed(() => ({ page: page.value, limit: LIMIT })),
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

    <div v-if="items.length" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="item in items" :key="item.id" class="flex flex-col overflow-hidden">
        <div class="flex-1 min-w-0">
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
    <UEmpty v-else title="Belum ada berita" description="Belum ada berita aktif." class="mt-6" />

    <div v-if="total > LIMIT" class="mt-6 flex justify-center">
      <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" :sibling-count="1" show-edges @update:page="onPageChange" />
    </div>

    <NewsImageLightbox v-model:open="lightboxOpen" :images="lightboxImages" :initial-index="lightboxIndex" />
  </div>
</template>
