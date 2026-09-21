<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, type ContentPage } from '@/lib/api'

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
        <p class="mt-1 text-sm text-slate-500">Isi body mendukung HTML sederhana (p, ol/ul, a, h2/h3). Perubahan langsung tampil di situs.</p>
      </div>
      <button class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500" @click="startAdd">
        + Tambah
      </button>
    </div>

    <p v-if="error" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div v-if="editing" class="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <div class="grid gap-3 sm:grid-cols-2">
        <div v-if="!editing.id">
          <label class="mb-1 block text-sm font-medium">Slug (tanpa spasi)</label>
          <input v-model="editing.slug" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Judul</label>
          <input v-model="editing.title" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Grup menu</label>
          <select v-model="editing.menuGroup" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option v-for="g in groups" :key="g.value" :value="g.value">{{ g.label }}</option>
          </select>
        </div>
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
      <div>
        <label class="mb-1 block text-sm font-medium">Isi (HTML)</label>
        <textarea v-model="editing.body" rows="10" class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"></textarea>
      </div>
      <div class="flex gap-2">
        <button :disabled="saving" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50" @click="save">
          {{ saving ? 'Menyimpan…' : 'Simpan' }}
        </button>
        <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm" @click="editing = null">Batal</button>
      </div>
    </div>

    <p v-if="loading" class="mt-4 text-sm text-slate-500">Memuat…</p>
    <div v-else class="mt-4 space-y-6">
      <div v-for="(list, group) in grouped" :key="group">
        <h2 class="font-semibold">{{ groupLabel(group) }}</h2>
        <div class="mt-2 space-y-2">
          <div v-for="row in list" :key="row.id" class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p class="font-medium">{{ row.title }}</p>
              <p class="text-xs text-slate-400">/{{ row.slug }} •
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
    </div>
  </div>
</template>
