<script setup lang="ts">
import type { Letter } from '~/composables/api'

const { data: res } = await useFetch<{ data: Letter[] }>('/api/letters', {
  default: () => ({ data: [] as Letter[] }),
})
const letters = computed(() => res.value.data)

function fileUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : `/${path}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div>
    <p class="text-sm text-muted">Informasi</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Surat Informasi Dapodik</h1>
    <p class="mt-1 text-sm text-muted">Surat edaran dan pemberitahuan resmi terkait pendataan Dapodik.</p>

    <div v-if="letters.length" class="mt-6 space-y-3">
      <UCard v-for="letter in letters" :key="letter.id">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-muted">
              {{ letter.nomorSurat }} • {{ formatDate(letter.tanggalSurat) }}
            </p>
            <h2 class="mt-1 font-semibold">{{ letter.judul }}</h2>
          </div>
          <UButton
            v-if="letter.filePath"
            :to="fileUrl(letter.filePath)"
            target="_blank"
            class="shrink-0"
          >
            Unduh PDF
          </UButton>
          <span v-else class="shrink-0 text-sm text-muted">Tanpa lampiran</span>
        </div>
      </UCard>
    </div>
    <UEmpty v-else title="Belum ada surat" description="Belum ada surat yang dipublikasikan." class="mt-6" />
  </div>
</template>
