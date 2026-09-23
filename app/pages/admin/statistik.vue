<script setup lang="ts">
import { api, STAT_META, type Statistic } from '~/composables/api'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const rows = ref<Statistic[]>([])
const loading = ref(true)
const error = ref('')
const editing = ref<(Omit<Partial<Statistic>, 'jenjang'> & { id?: number; jenjang?: string }) | null>(null)
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

function catLabel(cat: string): string {
  return categories.find((c) => c.value === cat)?.label ?? cat
}

function startAdd(): void {
  editing.value = { category: 'satuan_pendidikan', label: '', jenjang: '', value: 0, period: '', isCurrent: 1 }
}

function startEdit(row: Statistic): void {
  editing.value = { ...row, jenjang: row.jenjang ?? '' }
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
    if (f.id) await api.put(`/admin/statistics/${f.id}`, payload)
    else await api.post('/admin/statistics', payload)
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
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Kelola Statistik</h1>
        <p class="mt-1 text-sm text-muted">Input manual angka Dapodik per periode. Tanda "Aktif" tampil di publik.</p>
      </div>
      <UButton icon="i-lucide-plus" class="shrink-0" @click="startAdd">Tambah</UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />

    <UCard v-if="editing" class="mt-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Kategori">
          <USelect v-model="editing.category" :items="categories" value-key="value" label-key="label" class="w-full" />
        </UFormField>
        <UFormField label="Label">
          <UInput v-model="editing.label" placeholder="mis. Jumlah Satuan Pendidikan" class="w-full" />
        </UFormField>
        <UFormField label="Jenjang (opsional, kosongkan = total)">
          <UInput v-model="editing.jenjang" placeholder="mis. SD / SMP" class="w-full" />
        </UFormField>
        <UFormField label="Nilai">
          <UInput v-model.number="editing.value" type="number" min="0" step="1" class="w-full" />
        </UFormField>
        <UFormField label="Periode">
          <UInput v-model="editing.period" placeholder="mis. 2026/2027 Ganjil" class="w-full" />
        </UFormField>
        <div class="flex items-end pb-2">
          <UCheckbox v-model="editing.isCurrent" :true-value="1" :false-value="0" label="Aktif (tampil di publik)" />
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
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium">{{ row.label }}{{ row.jenjang ? ` (${row.jenjang})` : '' }}</p>
            <p class="mt-0.5 text-xs text-muted">
              {{ catLabel(row.category) }} • {{ row.period }} • <span class="font-bold text-highlighted">{{ row.value.toLocaleString('id-ID') }}</span>
            </p>
          </div>
          <UBadge v-if="row.isCurrent" color="success" variant="soft" class="shrink-0">Aktif</UBadge>
          <UBadge v-else color="neutral" variant="soft" class="shrink-0">Arsip</UBadge>
        </div>
        <div class="mt-2 flex gap-1 border-t border-default pt-2">
          <UButton variant="link" color="primary" class="px-0" @click="startEdit(row)">Ubah</UButton>
          <UButton variant="link" color="error" @click="remove(row.id)">Hapus</UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
