<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, type Complaint } from '@/lib/api'

const rows = ref<Complaint[]>([])
const loading = ref(true)
const error = ref('')
const filter = ref('')
const selected = ref<Complaint | null>(null)
const newStatus = ref<Complaint['status']>('baru')
const adminNote = ref('')
const saving = ref(false)

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

const filtered = computed(() => (filter.value ? rows.value.filter((r) => r.status === filter.value) : rows.value))

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
    await api.put(`/admin/complaints/${selected.value.id}`, { status: newStatus.value, adminNote: adminNote.value.trim() ? adminNote.value.trim() : null })
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

const statusStyle: Record<string, string> = {
  baru: 'bg-red-100 text-red-700',
  diproses: 'bg-amber-100 text-amber-800',
  selesai: 'bg-emerald-100 text-emerald-700',
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Pengaduan Masuk</h1>
        <p class="mt-1 text-sm text-slate-500">Ubah status menjadi diproses/selesai. Catatan admin bersifat internal.</p>
      </div>
      <select v-model="filter" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
        <option value="">Semua status</option>
        <option value="baru">Baru</option>
        <option value="diproses">Diproses</option>
        <option value="selesai">Selesai</option>
      </select>
    </div>

    <p v-if="error" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <div>
        <p v-if="loading" class="text-sm text-slate-500">Memuat…</p>
        <div v-else class="space-y-2">
          <button
            v-for="row in filtered"
            :key="row.id"
            class="w-full rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md"
            :class="selected?.id === row.id ? 'border-emerald-400' : 'border-slate-200'"
            @click="open(row)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-medium">#{{ row.id }} — {{ row.nama }}</p>
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="statusStyle[row.status]">{{ row.status }}</span>
            </div>
            <p class="mt-1 line-clamp-1 text-sm text-slate-500">{{ row.kategori }} • {{ row.isi }}</p>
            <p class="mt-1 text-xs text-slate-400">{{ fmt(row.createdAt) }}</p>
          </button>
          <p v-if="!filtered.length" class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Tidak ada pengaduan.
          </p>
        </div>
      </div>

      <div v-if="selected" class="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-bold">#{{ selected.id }} — {{ selected.nama }}</p>
            <p class="text-sm text-slate-500">{{ selected.kontak }} • {{ selected.kategori }}</p>
            <p class="text-xs text-slate-400">{{ fmt(selected.createdAt) }}</p>
          </div>
          <button class="text-sm text-red-600 hover:underline" @click="remove(selected.id)">Hapus</button>
        </div>
        <p class="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{{ selected.isi }}</p>
        <div class="mt-4 grid gap-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Status</label>
            <select v-model="newStatus" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="baru">Baru</option>
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Catatan admin (internal)</label>
            <textarea v-model="adminNote" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
          </div>
          <button :disabled="saving" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50" @click="save">
            {{ saving ? 'Menyimpan…' : 'Simpan perubahan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
