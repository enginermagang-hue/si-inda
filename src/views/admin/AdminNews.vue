<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type NewsItem } from '@/lib/api'

const rows = ref<NewsItem[]>([])
const loading = ref(true)
const error = ref('')
const editing = ref<(Partial<NewsItem> & { id?: number; expiresInput?: string }) | null>(null)
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
  editing.value = { ...row, expiresInput: row.expiresAt ? row.expiresAt.slice(0, 16) : '' }
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
        <p class="mt-1 text-sm text-slate-500">Berita aktif tampil sebagai ticker di situs. Isi tanggal kedaluwarsa agar otomatis hilang.</p>
      </div>
      <button class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500" @click="startAdd">
        + Tambah
      </button>
    </div>

    <p v-if="error" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div v-if="editing" class="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <div>
        <label class="mb-1 block text-sm font-medium">Judul</label>
        <input v-model="editing.title" type="text" maxlength="300" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Isi ringkas (opsional)</label>
        <textarea v-model="editing.body" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium">Kedaluwarsa (opsional)</label>
          <input v-model="editing.expiresInput" type="datetime-local" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div class="flex items-end pb-2">
          <label class="flex items-center gap-2 text-sm font-medium">
            <input v-model="editing.isActive" type="checkbox" :true-value="1" :false-value="0" class="h-4 w-4" />
            Aktif
          </label>
        </div>
      </div>
      <div class="flex gap-2">
        <button :disabled="saving" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50" @click="save">
          {{ saving ? 'Menyimpan…' : 'Simpan' }}
        </button>
        <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm" @click="editing = null">Batal</button>
      </div>
    </div>

    <p v-if="loading" class="mt-4 text-sm text-slate-500">Memuat…</p>
    <div v-else class="mt-4 space-y-2">
      <div v-for="row in rows" :key="row.id" class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <p class="font-medium">{{ row.title }}</p>
          <p class="text-xs text-slate-400">{{ fmt(row.publishedAt) }}{{ row.expiresAt ? ` • s.d. ${fmt(row.expiresAt)}` : '' }} •
            <span v-if="row.isActive" class="text-emerald-600">Aktif</span>
            <span v-else class="text-slate-400">Nonaktif</span>
          </p>
        </div>
        <div class="flex shrink-0 gap-3">
          <button class="text-sm text-emerald-700 hover:underline" @click="startEdit(row)">Ubah</button>
          <button class="text-sm text-red-600 hover:underline" @click="remove(row.id)">Hapus</button>
        </div>
      </div>
    </div>
  </div>
</template>
