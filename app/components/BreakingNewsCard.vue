<script setup lang="ts">
import type { NewsItem } from '~/composables/api'

const props = withDefaults(defineProps<{
  item: NewsItem
  to?: string
  lazy?: boolean
  aspect?: string
}>(), {
  to: '/informasi/berita',
  lazy: true,
  aspect: 'aspect-[3/2]',
})

const firstImage = computed(() => props.item.images?.[0])
const imgSrc = computed(() => firstImage.value?.filePath)
const imgAlt = computed(() => firstImage.value?.description || props.item.title)
</script>

<template>
  <UPageCard :to="to" variant="outline" :title="item.title" class="flex flex-col">
    <template #header>
      <div v-if="imgSrc" :class="aspect" class="overflow-hidden rounded">
        <img
          :src="imgSrc"
          :alt="imgAlt"
          :loading="lazy ? 'lazy' : 'eager'"
          class="size-full object-cover"
        >
      </div>
    </template>

    <template v-if="item.body" #description>
      <p class="mt-1 text-sm text-muted line-clamp-3">{{ item.body }}</p>
    </template>

    <template #footer>
      <p class="text-xs text-muted">
        {{ new Date(item.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
      </p>
    </template>
  </UPageCard>
</template>
