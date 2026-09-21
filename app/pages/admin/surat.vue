<script setup lang="ts">
import { api, type Letter } from '~/composables/api'

definePageMeta({ layout: 'admin', middleware: 'admin' })

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

function fileUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : `/${path}`
}

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
    if (editingId.value) await api.putForm(`/admin/letters/${editingId.value}`, form)
    else await api.postForm('/admin/letters', form)
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
        <p class="mt-1 text-sm text-muted">Unggah PDF maksimal 10 MB.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="startAdd">Tambah</UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />

    <UCard v-if="showForm" class="mt-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Nomor surat">
          <UInput v-model="nomorSurat" class="w-full" />
        </UFormField>
        <UFormField label="Tanggal surat">
          <UInput v-model="tanggalSurat" type="date" class="w-full" />
        </UFormField>
      </div>
      <UFormField label="Judul / perihal" class="mt-3">
        <UInput v-model="judul" class="w-full" />
      </UFormField>
      <UFormField :label="`File PDF${editingId ? ' (kosongkan bila tidak diganti)' : ''}`" class="mt-3">
        <UInput ref="fileInput" type="file" accept="application/pdf" class="w-full" />
      </UFormField>
      <UCheckbox v-model="isPublished" label="Publikasikan" class="mt-3" />
      <div class="mt-3 flex gap-2">
        <UButton :loading="saving" @click="save">Simpan</UButton>
        <UButton variant="ghost" color="neutral" @click="showForm = false">Batal</UButton>
      </div>
    </UCard>

    <p v-if="loading" class="mt-4 text-sm text-muted">Memuat…</p>
    <div v-else class="mt-4 space-y-2">
      <UCard v-for="row in rows" :key="row.id">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-medium">{{ row.judul }}</p>
            <p class="text-xs text-muted">
              {{ row.nomorSurat }} • {{ row.tanggalSurat.slice(0, 10) }} •
              <span v-if="row.isPublished" class="text-success">Publish</span>
              <span v-else>Draf</span>
              <ULink v-if="row.filePath" :to="fileUrl(row.filePath)" target="_blank" class="ml-1">PDF</ULink>
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
