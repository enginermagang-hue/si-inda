<script setup lang="ts">
import { api, type Complaint } from '~/composables/api'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const rows = ref<Complaint[]>([])
const loading = ref(true)
const error = ref('')
const filter = ref('all')
const search = ref('')
const selected = ref<Complaint | null>(null)
const newStatus = ref<Complaint['status']>('baru')
const adminNote = ref('')
const saving = ref(false)

const statusItems = [
  { value: 'all', label: 'Semua status' },
  { value: 'baru', label: 'Baru' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
]

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await api.get<{ data: Complaint[] }>('/admin/complaints')
    rows.value = res.data
    if (selected.value) {
      selected.value = rows.value.find((r) => r.id === selected.value?.id) ?? null
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (filter.value !== 'all' && r.status !== filter.value) return false
    if (!q) return true
    return (
      String(r.id).includes(q) ||
      r.nama.toLowerCase().includes(q) ||
      r.kontak.toLowerCase().includes(q) ||
      r.sekolah.toLowerCase().includes(q) ||
      r.kategori.toLowerCase().includes(q) ||
      r.isi.toLowerCase().includes(q)
    )
  })
})

const emptyTitle = computed(() => {
  const q = search.value.trim()
  if (q) return `Pencarian "${q}" tidak ditemukan`
  if (filter.value !== 'all') return `Tidak ada pengaduan dengan status "${filter.value}"`
  return 'Tidak ada pengaduan'
})

function open(row: Complaint): void {
  selected.value = row
  newStatus.value = row.status
  adminNote.value = row.adminNote ?? ''
}

async function save(): Promise<void> {
  if (!selected.value) return
  error.value = ''
  saving.value = true
  try {
    await api.put(`/admin/complaints/${selected.value.id}`, {
      status: newStatus.value,
      adminNote: adminNote.value.trim() ? adminNote.value.trim() : null,
    })
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}

async function remove(id: number): Promise<void> {
  if (!confirm('Hapus pengaduan ini permanen?')) return
  await api.del(`/admin/complaints/${id}`)
  selected.value = null
  await load()
}

const statusColor = (s: string): 'error' | 'warning' | 'success' =>
  s === 'baru' ? 'error' : s === 'diproses' ? 'warning' : 'success'

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Pengaduan Masuk</h1>
          <p class="mt-1 text-sm text-muted">Ubah status menjadi diproses/selesai. Catatan admin ditampilkan ke pengunjung di Lacak status.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UInput v-model="search" icon="i-lucide-search" placeholder="Cari pengaduan…" class="w-56" />
          <USelect v-model="filter" :items="statusItems" value-key="value" label-key="label" class="w-44" />
        </div>
      </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <div>
        <p v-if="loading" class="text-sm text-muted">Memuat…</p>
        <div v-else class="space-y-2">
          <UCard
            v-for="row in filtered"
            :key="row.id"
            class="cursor-pointer"
            variant="outline"
            :class="[
              'border-l-2 transition-colors',
              selected?.id === row.id ? 'border-l-primary bg-primary/5' : 'border-l-transparent',
            ]"
            @click="open(row)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-medium">#{{ row.id }} — {{ row.nama }}</p>
              <UBadge :color="statusColor(row.status)" variant="soft">{{ row.status }}</UBadge>
            </div>
            <p class="mt-1 line-clamp-1 text-sm text-muted">{{ row.kategori }} • {{ row.isi }}</p>
            <p class="mt-1 text-xs text-muted">{{ fmt(row.createdAt) }}</p>
          </UCard>
          <UEmpty v-if="!filtered.length" :title="emptyTitle" icon="i-lucide-search-x" class="mt-2" />
        </div>
      </div>

      <UCard v-if="selected" class="h-fit">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-bold">#{{ selected.id }} — {{ selected.nama }}</p>
            <p class="text-sm text-muted">{{ selected.kontak }} • {{ selected.sekolah }} • {{ selected.kategori }}</p>
            <p class="text-xs text-muted">{{ fmt(selected.createdAt) }}</p>
          </div>
          <UButton variant="link" color="error" @click="remove(selected.id)">Hapus</UButton>
        </div>
        <p class="mt-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{{ selected.isi }}</p>
        <div v-if="selected.filePath" class="mt-3">
          <a
            :href="selected.filePath.startsWith('uploads/') ? '/' + selected.filePath : selected.filePath"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <span class="i-lucide-download"></span>
            Unduh lampiran
          </a>
        </div>
        <div class="mt-4 grid gap-3">
          <UFormField label="Status">
            <USelect
              v-model="newStatus"
              :items="[
                { value: 'baru', label: 'Baru' },
                { value: 'diproses', label: 'Diproses' },
                { value: 'selesai', label: 'Selesai' },
              ]"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Catatan admin (ditampilkan ke pengunjung)">
            <UTextarea v-model="adminNote" :rows="3" class="w-full" />
          </UFormField>
          <UButton :loading="saving" @click="save">Simpan perubahan</UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
