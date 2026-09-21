<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, STAT_META, type Statistic } from '@/lib/api'

const rows = ref<Statistic[]>([])
const loading = ref(true)
const error = ref('')
const editing = ref<Partial<Statistic> & { id?: number } | null>(null)
const saving = ref(false)

const categories = Object.entries(STAT_META).map(([value, meta]) => ({ value, label: meta.title }))

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await api.get<{ data: Statistic[] }>('/admin/statistics')
    rows.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function startAdd(): void {
  editing.value = { category: 'satuan_pendidikan', label: '', jenjang: '', value: 0, period: '', isCurrent: 1 }
}

function startEdit(row: Statistic): void {
  editing.value = { ...row }
}

async function save(): Promise<void> {
  if (!editing.value) return
  error.value = ''
  const f = editing.value
  if (!f.label?.trim() || !f.period?.trim()) {
    error.value = 'Label dan periode wajib diisi.'
    return
  }
  saving.value = true
  try {
    const payload = {
      category: f.category,
      label: f.label.trim(),
      jenjang: f.jenjang?.trim() ? f.jenjang.trim() : null,
      value: Number(f.value) || 0,
      period: f.period.trim(),
      isCurrent: f.isCurrent ? 1 : 0,
    }
    if (f.id) {
      await api.put(`/admin/statistics/${f.id}`, payload)
    } else {
      await api.post('/admin/statistics', payload)
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
  if (!confirm('Hapus baris statistik ini?')) return
  await api.del(`/admin/statistics/${id}`)
  await load()
}

function catLabel(cat: string): string {
  return categories.find((c) => c.value === cat)?.label ?? cat
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Kelola Statistik</h1>
        <p class="mt-1 text-sm text-slate-500">Input manual angka Dapodik per periode. Centang "Aktif" agar tampil di publik (otomatis menonaktifkan periode lama pada kategori yang sama).</p>
      </div>
      <button class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500" @click="startAdd">
        + Tambah
      </button>
    </div>

    <p v-if="error" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div v-if="editing" class="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium">Kategori</label>
          <select v-model="editing.category" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Label</label>
          <input v-model="editing.label" type="text" placeholder="mis. Jumlah Satuan Pendidikan" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Jenjang (opsional, kosongkan = total)</label>
          <input v-model="editing.jenjang" type="text" placeholder="mis. SD / SMP" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Nilai</label>
          <input v-model.number="editing.value" type="number" min="0" step="1" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Periode</label>
          <input v-model="editing.period" type="text" placeholder="mis. 2026/2027 Ganjil" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div class="flex items-end pb-2">
          <label class="flex items-center gap-2 text-sm font-medium">
            <input v-model="editing.isCurrent" type="checkbox" :true-value="1" :false-value="0" class="h-4 w-4" />
            Aktif (tampil di publik)
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
    <div v-else class="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="px-4 py-3 font-medium">Kategori</th>
            <th class="px-4 py-3 font-medium">Label / Jenjang</th>
            <th class="px-4 py-3 font-medium">Periode</th>
            <th class="px-4 py-3 text-right font-medium">Nilai</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t border-slate-100">
            <td class="px-4 py-3">{{ catLabel(row.category) }}</td>
            <td class="px-4 py-3">{{ row.label }}{{ row.jenjang ? ` (${row.jenjang})` : '' }}</td>
            <td class="px-4 py-3">{{ row.period }}</td>
            <td class="px-4 py-3 text-right font-bold">{{ row.value.toLocaleString('id-ID') }}</td>
            <td class="px-4 py-3">
              <span v-if="row.isCurrent" class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Aktif</span>
              <span v-else class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Arsip</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button class="text-sm text-emerald-700 hover:underline" @click="startEdit(row)">Ubah</button>
                <button class="text-sm text-red-600 hover:underline" @click="remove(row.id)">Hapus</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
