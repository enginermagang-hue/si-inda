<script setup lang="ts">
import { api, type Faq, type FaqPopular } from '~/composables/api'

useHead({ title: 'FAQ — Pertanyaan Umum' })

const q = ref('')
const ALL_CATEGORIES = 'all'
const category = ref(ALL_CATEGORIES)
const rows = ref<Faq[]>([])
const popular = ref<FaqPopular | null>(null)
const loading = ref(true)
const openId = ref<number | null>(null)
const loggedViews = new Set<number>()
let debounce: ReturnType<typeof setTimeout> | null = null

async function loadPopular(): Promise<void> {
  try {
    const res = await api.get<{ data: FaqPopular }>('/faqs/popular?limit=5')
    popular.value = res.data
  } catch { /* abaikan */ }
}

async function load(): Promise<void> {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (q.value.trim()) params.set('q', q.value.trim())
    if (category.value && category.value !== ALL_CATEGORIES) params.set('category', category.value)
    const suffix = params.size ? `?${params}` : ''
    const res = await api.get<{ data: Faq[] }>(`/faqs${suffix}`)
    rows.value = res.data
  } catch { /* abaikan */ }
  finally { loading.value = false }
}

function onSearchInput(): void {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => {
    load()
    const kw = q.value.trim()
    if (kw.length >= 2) api.post('/faqs/search-log', { keyword: kw })
  }, 350)
}

async function toggle(row: Faq): Promise<void> {
  const willOpen = openId.value !== row.id
  openId.value = willOpen ? row.id : null
  if (willOpen && !loggedViews.has(row.id)) {
    loggedViews.add(row.id)
    row.viewCount += 1
    api.post(`/faqs/${row.id}/view`, {})
    api.post('/faqs/search-log', { keyword: row.question.slice(0, 100), faqId: row.id })
  }
}

function pickKeyword(kw: string): void {
  q.value = kw
  load()
}

function pickPopular(row: Faq): void {
  q.value = ''
  category.value = ALL_CATEGORIES
  load().then(() => toggle(rows.value.find((r) => r.id === row.id) ?? row))
}

await Promise.all([loadPopular(), load()])
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-3xl font-bold tracking-tight">Pertanyaan Umum (FAQ)</h1>
    <p class="mt-1 text-sm text-muted">Cari jawaban seputar layanan Dapodik.</p>

    <div class="mt-6 flex flex-col gap-3 sm:flex-row">
      <UInput v-model="q" icon="i-lucide-search" placeholder="Cari pertanyaan…" class="flex-1" @input="onSearchInput" />
      <USelect
        v-model="category"
        :items="[{ label: 'Semua kategori', value: ALL_CATEGORIES }, ...((popular?.categories ?? []).map((c) => ({ label: c, value: c })))]"
        value-key="value" label-key="label" class="sm:w-56" placeholder="Kategori"
        @update:model-value="load"
      />
    </div>

    <UCard v-if="popular && (popular.popularFaqs.length || popular.popularKeywords.length)" class="mt-6">
      <template #header>
        <p class="font-semibold">Paling sering ditanyakan & dicari</p>
      </template>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="k in popular.popularKeywords" :key="k.keyword" variant="soft" class="cursor-pointer"
          @click="pickKeyword(k.keyword)"
        >
          {{ k.keyword }} ({{ k.count }})
        </UBadge>
      </div>
      <ul class="mt-3 space-y-1">
        <li v-for="f in popular.popularFaqs" :key="f.id">
          <UButton variant="link" color="primary" class="p-0" @click="pickPopular(f)">
            {{ f.question }}
          </UButton>
          <span class="ml-1 text-xs text-muted">· {{ f.viewCount }}× dibaca</span>
        </li>
      </ul>
    </UCard>

    <p v-if="loading" class="mt-6 text-sm text-muted">Memuat…</p>
    <p v-else-if="!rows.length" class="mt-6 text-sm text-muted">Belum ada jawaban yang cocok.</p>
    <div v-else class="mt-6 space-y-2">
      <UCard v-for="row in rows" :key="row.id">
        <button class="flex w-full items-center justify-between gap-3 text-left" @click="toggle(row)">
          <span class="font-medium">{{ row.question }}</span>
          <UIcon :name="openId === row.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="shrink-0 text-muted" />
        </button>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="openId === row.id" class="richtext mt-3" v-html="row.answer" />
        <p class="mt-2 text-xs text-muted">{{ row.category }} · {{ row.viewCount }}× dibaca</p>
      </UCard>
    </div>
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
