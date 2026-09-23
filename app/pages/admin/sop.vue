<script setup lang="ts">
import { api, type Sop } from '~/composables/api'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const rows = ref<Sop[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const judul = ref('')
const deskripsi = ref('')
const isPublished = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await api.get<{ data: Sop[] }>('/admin/sops')
    rows.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function imgUrl(path: string | null): string {
  if (!path) return ''
  return /^https?:\/\//i.test(path) ? path : `/${path}`
}

function startAdd(): void {
  editingId.value = null
  judul.value = ''
  deskripsi.value = ''
  isPublished.value = true
  if (fileInput.value) fileInput.value.value = ''
  showForm.value = true
}

function startEdit(row: Sop): void {
  editingId.value = row.id
  judul.value = row.judul
  deskripsi.value = row.deskripsi ?? ''
  isPublished.value = row.isPublished === 1
  if (fileInput.value) fileInput.value.value = ''
  showForm.value = true
}

async function save(): Promise<void> {
  error.value = ''
  if (!judul.value.trim()) {
    error.value = 'Judul SOP wajib diisi.'
    return
  }
  const file = fileInput.value?.files?.[0]
  if (file && !file.type.startsWith('image/')) {
    error.value = 'File harus berformat gambar.'
    return
  }
  if (!editingId.value && !file) {
    error.value = 'Gambar SOP wajib diunggah.'
    return
  }
  saving.value = true
  try {
    const form = new FormData()
    form.append('judul', judul.value.trim())
    form.append('deskripsi', deskripsi.value.trim())
    form.append('is_published', isPublished.value ? '1' : '0')
    if (file) form.append('file', file)
    if (editingId.value) await api.putForm(`/admin/sops/${editingId.value}`, form)
    else await api.postForm('/admin/sops', form)
    showForm.value = false
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}

async function remove(id: number): Promise<void> {
  if (!confirm('Hapus SOP ini beserta gambarnya?')) return
  await api.del(`/admin/sops/${id}`)
  await load()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">SOP Pelayanan Dapodik</h1>
        <p class="mt-1 text-sm text-muted">Gambar SOP (PNG/JPG/GIF/WebP, maksimal 2 MB) tersimpan di Dropbox.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="startAdd">Tambah</UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />

    <UCard v-if="showForm" class="mt-4">
      <UFormField label="Judul SOP">
        <UInput v-model="judul" class="w-full" placeholder="cth. SOP Penerbitan NUPTK" />
      </UFormField>
      <UFormField label="Deskripsi / keterangan" class="mt-3">
        <UTextarea v-model="deskripsi" class="w-full" placeholder="Keterangan singkat tentang SOP ini" />
      </UFormField>
      <UFormField :label="`File gambar${editingId ? ' (kosongkan bila tidak diganti)' : ''}`" class="mt-3">
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
        >
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
          <div class="flex items-center gap-3">
            <img v-if="row.filePath" :src="imgUrl(row.filePath)" :alt="row.judul" class="h-14 w-14 shrink-0 rounded object-cover">
            <div>
              <p class="font-medium">{{ row.judul }}</p>
              <p class="text-xs text-muted">
                <span v-if="row.isPublished" class="text-success">Publish</span>
                <span v-else>Draf</span>
                <span v-if="row.deskripsi"> • {{ row.deskripsi }}</span>
              </p>
            </div>
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
