<template>
  <UModal v-model:open="internalOpen" :fullscreen="true" :close="false">
    <template #header>
      <div class="flex items-center justify-between w-full px-4 py-3 gap-4">
        <p class="text-sm font-medium">
          {{ title ?? 'Preview Gambar' }}
          <span v-if="images.length > 1" class="text-muted font-normal"> — {{ (currentIndex ?? 0) + 1 }} / {{ images.length }}</span>
        </p>
        <UButton icon="i-lucide-x" variant="ghost" color="neutral" aria-label="Tutup" @click="internalOpen = false" />
      </div>
    </template>

    <template #body>
      <div class="h-full flex flex-col">
        <div v-if="images.length" class="relative flex-1 flex items-center justify-center overflow-hidden">
          <UCarousel
            ref="carouselRef"
            v-slot="{ item }"
            :items="images"
            :start-index="startIndex"
            loop
            :arrows="false"
            :dots="images.length > 1 && images.length <= 8"
            class="w-full h-full"
            :ui="{ viewport: 'h-full', container: 'h-full' }"
            @select="onSelect"
          >
            <img
              :src="item.filePath ?? ''"
              :alt="item.description ?? ''"
              class="w-full h-full object-contain max-h-[70vh] sm:max-h-[78vh]"
              loading="eager"
            >
          </UCarousel>

          <template v-if="images.length > 1">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="solid"
              size="lg"
              aria-label="Gambar sebelumnya"
              class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/75 text-white backdrop-blur"
              @click="prev"
            />
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="solid"
              size="lg"
              aria-label="Gambar selanjutnya"
              class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/75 text-white backdrop-blur"
              @click="next"
            />
          </template>
        </div>
        <div v-else class="flex-1 flex items-center justify-center">
          <p class="text-sm text-muted">Tidak ada gambar.</p>
        </div>

        <div class="px-4 py-3 text-center border-t border-default">
          <p v-if="currentImage?.description" class="text-sm font-medium">{{ currentImage.description }}</p>
          <p v-else class="text-sm text-muted">Tanpa deskripsi</p>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { NewsImage } from '~/composables/api'

const props = withDefaults(defineProps<{
  open: boolean
  images: NewsImage[]
  initialIndex?: number
  title?: string
}>(), {
  initialIndex: 0,
  title: undefined,
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const internalOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val),
})

const startIndex = computed(() => {
  if (props.images.length === 0) return 0
  const idx = props.initialIndex ?? 0
  if (idx < 0) return 0
  if (idx >= props.images.length) return props.images.length - 1
  return idx
})

const currentIndex = ref(startIndex.value)

const currentImage = computed(() => {
  const idx = currentIndex.value
  return props.images[idx] ?? null
})

function onSelect(idx: number) {
  currentIndex.value = idx
}

const carouselRef = useTemplateRef<{ emblaApi: { scrollTo: (index: number) => void; scrollPrev: () => void; scrollNext: () => void } | null }>('carouselRef')

function syncIndex() {
  const target = startIndex.value
  currentIndex.value = target
  const api = carouselRef.value?.emblaApi
  if (api) api.scrollTo(target)
}

function prev(): void {
  const api = carouselRef.value?.emblaApi
  if (api?.scrollPrev) api.scrollPrev()
  else currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length
}

function next(): void {
  const api = carouselRef.value?.emblaApi
  if (api?.scrollNext) api.scrollNext()
  else currentIndex.value = (currentIndex.value + 1) % props.images.length
}

function onKey(e: KeyboardEvent): void {
  if (!props.open || props.images.length <= 1) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nextTick(syncIndex)
    window.addEventListener('keydown', onKey)
  } else {
    window.removeEventListener('keydown', onKey)
  }
})

watch(() => props.initialIndex, () => {
  if (props.open) nextTick(syncIndex)
})

watch(() => props.images.length, () => {
  if (props.open) nextTick(syncIndex)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})
</script>
