<script setup lang="ts">
import { api, type InfoLink } from '~/composables/api'

definePageMeta({ layout: 'admin', middleware: 'admin' })

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
        <p class="mt-1 text-sm text-muted">URL wajib diawali http(s)://.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="startAdd">Tambah</UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />

    <UCard v-if="editing" class="mt-4">
      <UFormField label="Judul">
        <UInput v-model="editing.title" class="w-full" />
      </UFormField>
      <UFormField label="URL" class="mt-3">
        <UInput v-model="editing.url" type="url" placeholder="https://…" class="w-full" />
      </UFormField>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <UFormField label="Urutan">
          <UInput v-model.number="editing.sortOrder" type="number" class="w-full" />
        </UFormField>
        <div class="flex items-end pb-2">
          <UCheckbox v-model="editing.isPublished" :true-value="1" :false-value="0" label="Publikasikan" />
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
          <div class="min-w-0">
            <p class="font-medium">{{ row.title }}</p>
            <p class="truncate text-xs text-muted">
              {{ row.url }} •
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
