<script setup lang="ts">
import { api, type NewsItem } from '~/composables/api'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const rows = ref<NewsItem[]>([])
const loading = ref(true)
const error = ref('')
const editing = ref<(Omit<Partial<NewsItem>, 'body'> & { id?: number; body?: string; expiresInput?: string }) | null>(null)
const saving = ref(false)

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await api.get<{ data: NewsItem[] }>('/admin/news')
    rows.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function startAdd(): void {
  editing.value = { title: '', body: '', isActive: 1, expiresInput: '' }
}

function startEdit(row: NewsItem): void {
  editing.value = { ...row, body: row.body ?? '', expiresInput: row.expiresAt ? row.expiresAt.slice(0, 16) : '' }
}

async function save(): Promise<void> {
  if (!editing.value) return
  error.value = ''
  const f = editing.value
  if (!f.title?.trim()) {
    error.value = 'Judul wajib diisi.'
    return
  }
  saving.value = true
  try {
    const payload = {
      title: f.title.trim(),
      body: f.body?.trim() ? f.body.trim() : null,
      isActive: f.isActive ? 1 : 0,
      expiresAt: f.expiresInput?.trim() ? new Date(f.expiresInput.trim()).toISOString() : null,
    }
    if (f.id) await api.put(`/admin/news/${f.id}`, payload)
    else await api.post('/admin/news', payload)
    editing.value = null
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}

async function remove(id: number): Promise<void> {
  if (!confirm('Hapus berita ini?')) return
  await api.del(`/admin/news/${id}`)
  await load()
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Breaking News</h1>
        <p class="mt-1 text-sm text-muted">Berita aktif tampil sebagai ticker di situs.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="startAdd">Tambah</UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />

    <UCard v-if="editing" class="mt-4">
      <UFormField label="Judul">
        <UInput v-model="editing.title" maxlength="300" class="w-full" />
      </UFormField>
      <UFormField label="Isi ringkas (opsional)" class="mt-3">
        <UTextarea v-model="editing.body" :rows="3" class="w-full" />
      </UFormField>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <UFormField label="Kedaluwarsa (opsional)">
          <UInput v-model="editing.expiresInput" type="datetime-local" class="w-full" />
        </UFormField>
        <div class="flex items-end pb-2">
          <UCheckbox v-model="editing.isActive" :true-value="1" :false-value="0" label="Aktif" />
        </div>
      </div>
      <div class="mt-3 flex gap-2">
        <UButton :loading="saving" @click="save">Simpan</UButton>
        <UButton variant="ghost" color="neutral" @click="editing = null">Batal</UButton>
      </div>
    </UCard>

    <p v-if="loading" class="mt-4 text-sm text-muted">Memuat…</p>
    <div v-else class="mt-4 space-y-2">
      <UCard v-for="row in rows" :key="row.id">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-medium">{{ row.title }}</p>
            <p class="text-xs text-muted">
              {{ fmt(row.publishedAt) }}{{ row.expiresAt ? ` • s.d. ${fmt(row.expiresAt)}` : '' }} •
              <span v-if="row.isActive" class="text-success">Aktif</span>
              <span v-else>Nonaktif</span>
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
