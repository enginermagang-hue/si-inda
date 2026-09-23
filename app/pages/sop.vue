<script setup lang="ts">
import type { Sop } from '~/composables/api'

const { data: res } = await useFetch<{ data: Sop[] }>('/api/sops', {
  default: () => ({ data: [] as Sop[] }),
})
const items = computed(() => res.value.data)
const active = ref<Sop | null>(null)
const modalOpen = computed({
  get: () => active.value !== null,
  set: (v: boolean) => { if (!v) active.value = null },
})

function imgUrl(path: string | null): string {
  if (!path) return ''
  return /^https?:\/\//i.test(path) ? path : `/${path}`
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">Layanan</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">SOP Pelayanan Dapodik</h1>
    <p class="mt-1 text-sm text-muted">Standar Operasional Prosedur pelayanan pendataan Dapodik.</p>

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
    <UEmpty v-else title="Belum ada SOP" description="Belum ada SOP yang dipublikasikan." class="mt-6" />

    <UModal v-model:open="modalOpen" :title="active?.judul">
      <template #body>
        <img v-if="active?.filePath" :src="imgUrl(active.filePath)" :alt="active.judul" class="w-full rounded-md">
        <p v-if="active?.deskripsi" class="mt-3 text-sm text-muted">{{ active.deskripsi }}</p>
      </template>
    </UModal>
  </div>
</template>
