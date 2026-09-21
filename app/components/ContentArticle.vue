<script setup lang="ts">
import type { ContentPage } from '~/composables/api'

const props = defineProps<{ groupLabel: string }>()

const route = useRoute()
const { data: res, error } = await useFetch<{ data: ContentPage | null }>(
  () => `/api/pages/${route.params.slug}`,
  {
    default: () => ({ data: null as ContentPage | null }),
    watch: [() => route.params.slug],
  },
)
const page = computed(() => res.value.data)

if (error.value) {
  throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan.' })
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">{{ props.groupLabel }}</p>
    <article v-if="page" class="mt-2">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ page.title }}</h1>
      <p class="mt-1 text-xs text-muted">
        Diperbarui {{ new Date(page.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
      </p>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="richtext mt-4" v-html="page.body" />
    </article>
  </div>
</template>

<style scoped>
.richtext :deep(p) {
  margin: 0.75rem 0;
}
.richtext :deep(ol),
.richtext :deep(ul) {
  margin: 0.75rem 0 0.75rem 1.25rem;
}
.richtext :deep(ol) {
  list-style: decimal;
}
.richtext :deep(ul) {
  list-style: disc;
}
.richtext :deep(li) {
  margin: 0.25rem 0;
}
.richtext :deep(a) {
  color: var(--ui-primary);
  text-decoration: underline;
}
.richtext :deep(h2),
.richtext :deep(h3) {
  font-weight: 700;
  margin: 1.25rem 0 0.5rem;
}
</style>
