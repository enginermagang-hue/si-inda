<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, type ContentPage } from '@/lib/api'

const route = useRoute()
const page = ref<ContentPage | null>(null)
const loading = ref(true)
const error = ref('')

const groupLabel: Record<string, string> = {
  ptk: 'PTK',
  'peserta-didik': 'Peserta Didik',
  sarana: 'Sarana Prasarana',
}

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  page.value = null
  try {
    const res = await api.get<{ data: ContentPage }>(`/pages/${route.params.slug}`)
    page.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat halaman.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.slug, load)
</script>

<template>
  <div>
    <p class="text-sm text-slate-500">{{ groupLabel[route.params.group as string] ?? 'Informasi Layanan' }}</p>
    <p v-if="loading" class="mt-6 text-sm text-slate-500">Memuat…</p>
    <p v-else-if="error" class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</p>
    <article v-else-if="page" class="mt-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ page.title }}</h1>
      <p class="mt-1 text-xs text-slate-400">
        Diperbarui {{ new Date(page.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
      </p>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="richtext mt-4" v-html="page.body"></div>
    </article>
  </div>
</template>

<style scoped>
.richtext :deep(p) {
  margin: 0.75rem 0;
  color: #334155;
}
.richtext :deep(ol),
.richtext :deep(ul) {
  margin: 0.75rem 0 0.75rem 1.25rem;
  color: #334155;
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
  color: #059669;
  text-decoration: underline;
}
.richtext :deep(h2),
.richtext :deep(h3) {
  font-weight: 700;
  margin: 1.25rem 0 0.5rem;
  color: #0f172a;
}
</style>
