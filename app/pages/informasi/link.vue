<script setup lang="ts">
import type { InfoLink } from '~/composables/api'

const { data: res } = await useFetch<{ data: InfoLink[] }>('/api/links', {
  default: () => ({ data: [] as InfoLink[] }),
})
const links = computed(() => res.value.data)
</script>

<template>
  <div>
    <p class="text-sm text-muted">Informasi</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Link Informasi Dapodik</h1>
    <p class="mt-1 text-sm text-muted">Tautan penting aplikasi dan layanan pendataan.</p>

    <div v-if="links.length" class="mt-6 grid gap-3 sm:grid-cols-2">
      <UPageCard
        v-for="link in links"
        :key="link.id"
        :title="link.title"
        :description="link.url"
        icon="i-lucide-link"
        :to="link.url"
        target="_blank"
        variant="outline"
      />
    </div>
    <UEmpty v-else title="Belum ada link" description="Belum ada link yang dipublikasikan." class="mt-6" />
  </div>
</template>
