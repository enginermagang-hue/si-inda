<script setup lang="ts">
import type { NewsItem, NewsImage } from '~/composables/api'

const { data: res } = await useFetch<{ data: NewsItem[] }>('/api/breaking-news', {
  default: () => ({ data: [] as NewsItem[] }),
})
const items = computed(() => res.value.data)

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
</script>

<template>
  <div>
    <p class="text-sm text-muted">Informasi</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Breaking News</h1>
    <p class="mt-1 text-sm text-muted">Kabar terbaru seputar pendataan Dapodik.</p>

    <div v-if="items.length" class="mt-6 space-y-3">
      <UCard v-for="item in items" :key="item.id">
        <p class="text-xs text-muted">{{ formatDate(item.publishedAt) }}</p>
        <h2 class="mt-1 font-semibold">{{ item.title }}</h2>
        <p v-if="item.body" class="mt-1 text-sm text-muted">{{ item.body }}</p>

        <div v-if="(item.images ?? []).length" class="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <div
            v-for="(img, i) in item.images"
            :key="img.id"
            class="relative rounded-lg overflow-hidden bg-elevated/50 group cursor-pointer"
            @click="viewImage(item.images ?? [], i)"
          >
            <img
              :src="img.filePath ?? ''"
              class="w-full h-40 object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              @click="viewImage(item.images ?? [], i)"
            >
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <UIcon name="i-lucide-zoom-in" class="text-white text-2xl" />
            </div>
          </div>
        </div>
      </UCard>
    </div>
    <UEmpty v-else title="Belum ada berita" description="Belum ada berita aktif." class="mt-6" />

    <UModal v-model:open="lightboxOpen" :fullscreen="true">
      <template #header>
        <div class="flex items-center justify-between px-4 py-3">
          <p class="text-sm font-medium">Preview Gambar</p>
          <UButton icon="i-lucide-x" variant="ghost" color="neutral" @click="lightboxOpen = false" />
        </div>
      </template>
      <template #body>
        <div class="h-full flex flex-col">
          <div v-if="lightboxImages.length" class="flex-1 flex items-center justify-center overflow-hidden">
            <img
              :src="lightboxImages[lightboxIndex]?.filePath ?? ''"
              class="w-full h-full object-contain max-h-screen"
              loading="eager"
            >
          </div>
          <div class="px-4 py-3 text-center border-t border-default">
            <p v-if="lightboxImages[lightboxIndex]?.description" class="text-sm font-medium">
              {{ lightboxImages[lightboxIndex]!.description }}
            </p>
            <p v-else class="text-sm text-muted">Tanpa deskripsi</p>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
