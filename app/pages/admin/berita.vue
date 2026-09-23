<script setup lang="ts">
import { api, type NewsItem, type NewsImage } from '~/composables/api'
import NewsImageUploader from '~/components/NewsImageUploader.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const rows = ref<NewsItem[]>([])
const loading = ref(true)
const loadError = ref('')
const showForm = ref(false)
const editing = ref<(Omit<Partial<NewsItem>, 'body' | 'images'> & { id?: number; body?: string; expiresInput?: string; images?: NewsImage[] }) | null>(null)
const saving = ref(false)
const error = ref('')
const lightboxOpen = ref(false)
const lightboxImages = ref<NewsImage[]>([])
const lightboxIndex = ref(0)
const pendingUploads = ref<{ files: File[]; descriptions: string[] }>({ files: [], descriptions: [] })
const uploaderRef = ref<InstanceType<typeof NewsImageUploader> | null>(null)

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await api.get<{ data: NewsItem[] }>('/admin/news')
    rows.value = res.data
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function startAdd(): void {
  error.value = ''
  editing.value = { title: '', body: '', isActive: 1, expiresInput: '', images: [] }
  pendingUploads.value = { files: [], descriptions: [] }
  showForm.value = true
}

function startEdit(row: NewsItem): void {
  error.value = ''
  editing.value = {
    ...row,
    body: row.body ?? '',
    expiresInput: row.expiresAt ? row.expiresAt.slice(0, 16) : '',
    images: row.images ?? [],
  }
  pendingUploads.value = { files: [], descriptions: [] }
  showForm.value = true
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
    if (uploaderRef.value) {
      await uploaderRef.value.doUpload()
    }

    const payload = {
      title: f.title.trim(),
      body: f.body?.trim() ? f.body.trim() : null,
      isActive: f.isActive ? 1 : 0,
      expiresAt: f.expiresInput?.trim() ? new Date(f.expiresInput.trim()).toISOString() : null,
    }

    let newsId = f.id
    if (f.id) {
      await api.put<{ data: NewsItem }>(`/admin/news/${f.id}`, payload)
    } else {
      const res = await api.post<{ data: NewsItem }>('/admin/news', payload)
      newsId = res.data.id
    }

    if (newsId) {
      const pending = pendingUploads.value
      if (pending.files.length) {
        const form = new FormData()
        pending.files.forEach((file) => form.append('images', file))
        form.append('descriptions', JSON.stringify(pending.descriptions))
        await api.postForm<{ data: unknown[] }>(`/admin/news/${newsId}/images`, form)
        pendingUploads.value = { files: [], descriptions: [] }
      }
    }

    showForm.value = false
    editing.value = null
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}

async function handleUpload(files: File[], descriptions: string[]): Promise<void> {
  if (!editing.value?.id) {
    pendingUploads.value = { files, descriptions }
    return
  }
  try {
    const form = new FormData()
    files.forEach((file) => form.append('images', file))
    form.append('descriptions', JSON.stringify(descriptions))
    await api.postForm<{ data: unknown[] }>(`/admin/news/${editing.value.id}/images`, form)
    pendingUploads.value = { files: [], descriptions: [] }
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal mengunggah gambar.'
  }
}

async function handleRemoveImage(imageId: number): Promise<void> {
  if (!editing.value?.id) return
  if (!confirm('Hapus gambar ini?')) return
  try {
    await api.del(`/admin/news/${editing.value.id}/images/${imageId}`)
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menghapus gambar.'
  }
}

async function handleUpdateDescription(imageId: number, description: string): Promise<void> {
  if (!editing.value?.id) return
  try {
    await api.put<{ data: NewsImage }>(`/admin/news/${editing.value.id}/images/${imageId}`, { description })
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memperbarui deskripsi.'
  }
}

function viewImage(image: NewsImage, index: number): void {
  lightboxImages.value = editing.value?.images ?? []
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function remove(id: number): Promise<void> {
  if (!confirm('Hapus berita ini?')) return
  await api.del(`/admin/news/${id}`)
  await load()
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

    <UAlert v-if="loadError" color="error" variant="soft" :title="loadError" class="mt-4" />

    <p v-if="loading" class="mt-4 text-sm text-muted">Memuat…</p>
    <div v-else class="mt-4 space-y-2">
      <UCard v-for="row in rows" :key="row.id">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium">{{ row.title }}</p>
            <p v-if="(row.images ?? []).length" class="text-xs text-muted mt-0.5">
              <UIcon name="i-lucide-image" class="inline mr-1" />
              {{ (row.images ?? []).length }} gambar
            </p>
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

<UModal v-model:open="showForm">
      <template #header>
        <div class="flex items-center justify-between px-4 py-3">
          <p class="text-sm font-medium">
            {{ editing?.id ? 'Ubah Breaking News' : 'buat Breaking News' }}
          </p>
          <UButton icon="i-lucide-x" variant="ghost" color="neutral" @click="showForm = false" />
        </div>
      </template>
      <template #body>
        <div v-if="editing" class="px-4 py-2">
          <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-4" />

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

          <div class="mt-4 border-t border-default pt-4">
            <p class="text-sm font-medium mb-2">Gambar</p>
            <NewsImageUploader
              ref="uploaderRef"
              :existing-images="editing.images ?? []"
              @upload="handleUpload"
              @remove="handleRemoveImage"
              @update-description="handleUpdateDescription"
              @view="viewImage"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 px-4 py-3">
          <UButton variant="ghost" color="neutral" @click="showForm = false">Batal</UButton>
          <UButton :loading="saving" @click="save">Simpan</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="lightboxOpen" :fullscreen="true">
      <template #header>
        <div class="flex items-center justify-between px-4 py-3">
          <p class="text-sm font-medium">Preview Gambar</p>
          <UButton icon="i-lucide-x" variant="ghost" color="neutral" @click="lightboxOpen = false" />
        </div>
      </template>
      <template #body>
        <div class="h-full flex flex-col">
          <div v-if="lightboxImages.length" class="flex-1 flex items-center justify-center overflow-hidden">
            <img
              :src="lightboxImages[lightboxIndex]?.filePath ?? ''"
              class="w-full h-full object-contain max-h-screen"
              loading="eager"
            >
          </div>
          <div class="px-4 py-3 text-center border-t border-default">
            <p v-if="lightboxImages[lightboxIndex]?.description" class="text-sm font-medium">
              {{ lightboxImages[lightboxIndex]!.description }}
            </p>
            <p v-else class="text-sm text-muted">Tanpa deskripsi</p>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
