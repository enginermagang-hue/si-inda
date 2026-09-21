<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type Letter } from '@/lib/api'

const rows = ref<Letter[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const nomorSurat = ref('')
const judul = ref('')
const tanggalSurat = ref('')
const isPublished = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await api.get<{ data: Letter[] }>('/admin/letters')
    rows.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function startAdd(): void {
  editingId.value = null
  nomorSurat.value = ''
  judul.value = ''
  tanggalSurat.value = ''
  isPublished.value = true
  if (fileInput.value) fileInput.value.value = ''
  showForm.value = true
}

function startEdit(row: Letter): void {
  editingId.value = row.id
  nomorSurat.value = row.nomorSurat
  judul.value = row.judul
  tanggalSurat.value = row.tanggalSurat.slice(0, 10)
  isPublished.value = row.isPublished === 1
  if (fileInput.value) fileInput.value.value = ''
  showForm.value = true
}

async function save(): Promise<void> {
  error.value = ''
  if (!nomorSurat.value.trim() || !judul.value.trim() || !tanggalSurat.value) {
    error.value = 'Nomor, judul, dan tanggal wajib diisi.'
    return
  }
  const file = fileInput.value?.files?.[0]
  if (file && file.type !== 'application/pdf') {
    error.value = 'File harus PDF.'
    return
  }
  if (!editingId.value && !file) {
    error.value = 'Lampiran PDF wajib untuk surat baru.'
    return
  }
  saving.value = true
  try {
    const form = new FormData()
    form.append('nomor_surat', nomorSurat.value.trim())
    form.append('judul', judul.value.trim())
    form.append('tanggal_surat', tanggalSurat.value)
    form.append('is_published', isPublished.value ? '1' : '0')
    if (file) form.append('file', file)
    if (editingId.value) {
      await api.putForm(`/admin/letters/${editingId.value}`, form)
    } else {
      await api.postForm('/admin/letters', form)
    }
    showForm.value = false
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}

async function remove(id: number): Promise<void> {
  if (!confirm('Hapus surat ini beserta file PDF-nya?')) return
  await api.del(`/admin/letters/${id}`)
  await load()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Surat Informasi Dapodik</h1>
        <p class="mt-1 text-sm text-slate-500">Unggah PDF maksimal 10 MB. File lama otomatis diganti saat upload baru.</p>
      </div>
      <button class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500" @click="startAdd">
        + Tambah
      </button>
    </div>

    <p v-if="error" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div v-if="showForm" class="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium">Nomor surat</label>
          <input v-model="nomorSurat" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Tanggal surat</label>
          <input v-model="tanggalSurat" type="date" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Judul / perihal</label>
        <input v-model="judul" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">File PDF {{ editingId ? '(kosongkan bila tidak diganti)' : '' }}</label>
        <input ref="fileInput" type="file" accept="application/pdf" class="w-full text-sm" />
      </div>
      <label class="flex items-center gap-2 text-sm font-medium">
        <input v-model="isPublished" type="checkbox" class="h-4 w-4" /> Publikasikan
      </label>
      <div class="flex gap-2">
        <button :disabled="saving" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50" @click="save">
          {{ saving ? 'Mengunggah…' : 'Simpan' }}
        </button>
        <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm" @click="showForm = false">Batal</button>
      </div>
    </div>

    <p v-if="loading" class="mt-4 text-sm text-slate-500">Memuat…</p>
    <div v-else class="mt-4 space-y-2">
      <div v-for="row in rows" :key="row.id" class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <p class="font-medium">{{ row.judul }}</p>
          <p class="text-xs text-slate-400">{{ row.nomorSurat }} • {{ row.tanggalSurat.slice(0, 10) }} •
            <span v-if="row.isPublished" class="text-emerald-600">Publish</span>
            <span v-else class="text-slate-400">Draft</span>
            <a v-if="row.filePath" :href="`/${row.filePath}`" target="_blank" rel="noopener" class="ml-1 text-emerald-700 underline">PDF</a>
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
