<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type InfoLink } from '@/lib/api'

const rows = ref<InfoLink[]>([])
const loading = ref(true)
const error = ref('')
const editing = ref<(Partial<InfoLink> & { id?: number }) | null>(null)
const saving = ref(false)

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await api.get<{ data: InfoLink[] }>('/admin/links')
    rows.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function startAdd(): void {
  editing.value = { title: '', url: '', sortOrder: 0, isPublished: 1 }
}

function startEdit(row: InfoLink): void {
  editing.value = { ...row }
}

async function save(): Promise<void> {
  if (!editing.value) return
  error.value = ''
  const f = editing.value
  if (!f.title?.trim() || !f.url?.trim()) {
    error.value = 'Judul dan URL wajib diisi.'
    return
  }
  saving.value = true
  try {
    const payload = {
      title: f.title.trim(),
      url: f.url.trim(),
      sortOrder: Number(f.sortOrder) || 0,
      isPublished: f.isPublished ? 1 : 0,
    }
    if (f.id) await api.put(`/admin/links/${f.id}`, payload)
    else await api.post('/admin/links', payload)
    editing.value = null
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}

async function remove(id: number): Promise<void> {
  if (!confirm('Hapus link ini?')) return
  await api.del(`/admin/links/${id}`)
  await load()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Link Informasi Dapodik</h1>
        <p class="mt-1 text-sm text-slate-500">URL wajib diawali http(s)://.</p>
      </div>
      <button class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500" @click="startAdd">
        + Tambah
      </button>
    </div>

    <p v-if="error" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div v-if="editing" class="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <div>
        <label class="mb-1 block text-sm font-medium">Judul</label>
        <input v-model="editing.title" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">URL</label>
        <input v-model="editing.url" type="url" placeholder="https://…" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium">Urutan</label>
          <input v-model.number="editing.sortOrder" type="number" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div class="flex items-end pb-2">
          <label class="flex items-center gap-2 text-sm font-medium">
            <input v-model="editing.isPublished" type="checkbox" :true-value="1" :false-value="0" class="h-4 w-4" />
            Publikasikan
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
        <div class="min-w-0">
          <p class="font-medium">{{ row.title }}</p>
          <p class="truncate text-xs text-slate-400">{{ row.url }} •
            <span v-if="row.isPublished" class="text-emerald-600">Publish</span>
            <span v-else class="text-slate-400">Draft</span>
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
