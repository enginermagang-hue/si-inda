<script setup lang="ts">
import { api, type ContentPage } from '~/composables/api'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const rows = ref<ContentPage[]>([])
const loading = ref(true)
const error = ref('')
const editing = ref<(Partial<ContentPage> & { id?: number }) | null>(null)
const saving = ref(false)

const groups = [
  { value: 'ptk', label: 'PTK' },
  { value: 'peserta_didik', label: 'Peserta Didik' },
  { value: 'sarana', label: 'Sarana Prasarana' },
]

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await api.get<{ data: ContentPage[] }>('/admin/pages')
    rows.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function groupLabel(g: string): string {
  return groups.find((x) => x.value === g)?.label ?? g
}

function startAdd(): void {
  editing.value = { slug: '', menuGroup: 'ptk', title: '', body: '', isPublished: 1, sortOrder: 0 }
}

function startEdit(row: ContentPage): void {
  editing.value = { ...row }
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
    if (f.id) {
      await api.put(`/admin/pages/${f.id}`, {
        title: f.title.trim(),
        menuGroup: f.menuGroup,
        body: f.body ?? '',
        isPublished: f.isPublished ? 1 : 0,
        sortOrder: Number(f.sortOrder) || 0,
      })
    } else {
      if (!f.slug?.trim()) {
        error.value = 'Slug wajib diisi untuk halaman baru.'
        saving.value = false
        return
      }
      await api.post('/admin/pages', {
        slug: f.slug.trim(),
        title: f.title.trim(),
        menuGroup: f.menuGroup,
        body: f.body ?? '',
        isPublished: f.isPublished ? 1 : 0,
        sortOrder: Number(f.sortOrder) || 0,
      })
    }
    editing.value = null
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}

async function remove(id: number): Promise<void> {
  if (!confirm('Hapus halaman ini? Pengunjung akan mendapat 404.')) return
  await api.del(`/admin/pages/${id}`)
  await load()
}

const grouped = computed(() => {
  const out: Record<string, ContentPage[]> = {}
  for (const r of rows.value) {
    const list = out[r.menuGroup]
    if (list) list.push(r)
    else out[r.menuGroup] = [r]
  }
  return out
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Halaman Syarat Layanan</h1>
        <p class="mt-1 text-sm text-muted">Isi body mendukung HTML sederhana. Perubahan langsung tampil di situs.</p>
      </div>
      <UButton icon="i-lucide-plus" @click="startAdd">Tambah</UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />

    <UCard v-if="editing" class="mt-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField v-if="!editing.id" label="Slug (tanpa spasi)">
          <UInput v-model="editing.slug" class="w-full" />
        </UFormField>
        <UFormField label="Judul">
          <UInput v-model="editing.title" class="w-full" />
        </UFormField>
        <UFormField label="Grup menu">
          <USelect v-model="editing.menuGroup" :items="groups" value-key="value" label-key="label" class="w-full" />
        </UFormField>
        <UFormField label="Urutan">
          <UInput v-model.number="editing.sortOrder" type="number" class="w-full" />
        </UFormField>
        <div class="flex items-end pb-2">
          <UCheckbox v-model="editing.isPublished" :true-value="1" :false-value="0" label="Publikasikan" />
        </div>
      </div>
      <UFormField label="Isi (HTML)" class="mt-3">
        <UTextarea v-model="editing.body" :rows="10" class="w-full font-mono" />
      </UFormField>
      <div class="mt-3 flex gap-2">
        <UButton :loading="saving" @click="save">Simpan</UButton>
        <UButton variant="ghost" color="neutral" @click="editing = null">Batal</UButton>
      </div>
    </UCard>

    <p v-if="loading" class="mt-4 text-sm text-muted">Memuat…</p>
    <div v-else class="mt-4 space-y-6">
      <div v-for="(list, group) in grouped" :key="group">
        <h2 class="font-semibold">{{ groupLabel(group) }}</h2>
        <div class="mt-2 space-y-2">
          <UCard v-for="row in list" :key="row.id">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-medium">{{ row.title }}</p>
                <p class="text-xs text-muted">
                  /{{ row.slug }} •
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
    </div>
  </div>
</template>
