<script setup lang="ts">
import { api, type Faq } from '~/composables/api'
import RichTextEditor from '~/components/editor/RichTextEditor.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface FaqStats {
  topFaqs: Faq[]
  topKeywords: Array<{ keyword: string; count: number }>
}

const rows = ref<Faq[]>([])
const stats = ref<FaqStats | null>(null)
const loading = ref(true)
const error = ref('')
const editing = ref<(Partial<Faq> & { id?: number }) | null>(null)
const showModal = ref(false)
const saving = ref(false)

async function load(): Promise<void> {
  loading.value = true
  try {
    const [r, s] = await Promise.all([
      api.get<{ data: Faq[] }>('/admin/faqs'),
      api.get<{ data: FaqStats }>('/admin/faqs/stats'),
    ])
    rows.value = r.data
    stats.value = s.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function startAdd(): void {
  editing.value = { question: '', answer: '', category: 'Umum', sortOrder: 0, isPublished: 1 }
  showModal.value = true
}

function startEdit(row: Faq): void {
  editing.value = { ...row }
  showModal.value = true
}

async function save(): Promise<void> {
  if (!editing.value) return
  error.value = ''
  const f = editing.value
  if (!f.question?.trim()) {
    error.value = 'Pertanyaan wajib diisi.'
    return
  }
  saving.value = true
  try {
    const payload = {
      question: f.question.trim(),
      answer: f.answer ?? '',
      category: f.category?.trim() || 'Umum',
      sortOrder: Number(f.sortOrder) || 0,
      isPublished: f.isPublished ? 1 : 0,
    }
    if (f.id) await api.put(`/admin/faqs/${f.id}`, payload)
    else await api.post('/admin/faqs', payload)
    editing.value = null
    showModal.value = false
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}

async function remove(id: number): Promise<void> {
  if (!confirm('Hapus FAQ ini?')) return
  await api.del(`/admin/faqs/${id}`)
  await load()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">FAQ</h1>
        <p class="mt-1 text-sm text-muted">Jawaban mendukung HTML (bold, list, link) via editor.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="startAdd">Tambah</UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />

    <div v-if="stats?.topKeywords?.length || stats?.topFaqs?.length" class="mt-4 grid gap-4 md:grid-cols-2">
      <UCard>
        <template #header><p class="font-semibold">Pertanyaan paling dibuka</p></template>
        <ul class="space-y-1 text-sm">
          <li v-for="f in stats?.topFaqs" :key="f.id">{{ f.question }} <span class="text-muted">· {{ f.viewCount }}×</span></li>
        </ul>
      </UCard>
      <UCard>
        <template #header><p class="font-semibold">Kata kunci paling dicari</p></template>
        <ul class="space-y-1 text-sm">
          <li v-for="k in stats?.topKeywords" :key="k.keyword">{{ k.keyword }} <span class="text-muted">· {{ k.count }}×</span></li>
        </ul>
      </UCard>
    </div>

    <UModal v-model:open="showModal" title="FAQ" :ui="{ content: 'w-[calc(100vw-2rem)] max-w-3xl' }" @close="editing = null">
      <template #body>
        <div v-if="editing" class="space-y-3">
          <UFormField label="Pertanyaan">
            <UInput v-model="editing.question" class="w-full" />
          </UFormField>
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Kategori">
              <UInput v-model="editing.category" class="w-full" placeholder="Umum" />
            </UFormField>
            <UFormField label="Urutan">
              <UInput v-model.number="editing.sortOrder" type="number" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Jawaban">
            <RichTextEditor v-model="editing.answer" />
          </UFormField>
          <UCheckbox v-model="editing.isPublished" :true-value="1" :false-value="0" label="Publikasikan" />
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex gap-2">
          <UButton :loading="saving" @click="save">Simpan</UButton>
          <UButton variant="ghost" color="neutral" @click="close">Batal</UButton>
        </div>
      </template>
    </UModal>

    <p v-if="loading" class="mt-4 text-sm text-muted">Memuat…</p>
    <div v-else class="mt-4 space-y-2">
      <UCard v-for="row in rows" :key="row.id">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium">{{ row.question }}</p>
            <p class="truncate text-xs text-muted">
              {{ row.category }} · {{ row.viewCount }}× dibaca ·
              <span v-if="row.isPublished" class="text-success">Publish</span>
              <span v-else>Draf</span>
            </p>
          </div>
          <div class="flex shrink-0 gap-1">
            <UButton variant="link" color="primary" @click="startEdit(row)">Ubah</UButton>
            <UButton variant="link" color="error" @click="remove(row.id)">Hapus</UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
