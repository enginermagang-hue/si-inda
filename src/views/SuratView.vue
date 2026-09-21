<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type Letter } from '@/lib/api'

const letters = ref<Letter[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get<{ data: Letter[] }>('/letters')
    letters.value = res.data
  } catch {
    letters.value = []
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div>
    <p class="text-sm text-slate-500">Informasi</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Surat Informasi Dapodik</h1>
    <p class="mt-1 text-sm text-slate-500">Surat edaran dan pemberitahuan resmi terkait pendataan Dapodik.</p>

    <p v-if="loading" class="mt-6 text-sm text-slate-500">Memuat data…</p>
    <div v-else-if="letters.length" class="mt-6 space-y-3">
      <div
        v-for="letter in letters"
        :key="letter.id"
        class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ letter.nomorSurat }} • {{ formatDate(letter.tanggalSurat) }}</p>
          <h2 class="mt-1 font-semibold">{{ letter.judul }}</h2>
        </div>
        <a
          v-if="letter.filePath"
          :href="`/${letter.filePath}`"
          target="_blank"
          rel="noopener"
          class="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Unduh PDF
        </a>
        <span v-else class="shrink-0 text-sm text-slate-400">Tanpa lampiran</span>
      </div>
    </div>
    <p v-else class="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      Belum ada surat yang dipublikasikan.
    </p>
  </div>
</template>
