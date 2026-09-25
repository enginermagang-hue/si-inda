<script setup lang="ts">
import { api } from '~/composables/api'
import { kabupatenList } from '~/data/kabupaten'
import type { StatisticsData, StatisticsDetailItem } from '~/../server/utils/statistics'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const statisticsData = ref<StatisticsData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const activeCategory = ref<'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik'>('satuan_pendidikan')
const successMessage = ref('')
const editingDetail = ref<StatisticsDetailItem | null>(null)
const editingCategoryKey = ref<'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik' | null>(null)
const editingIndex = ref(-1)
const showModal = ref(false)

const categories = [
  { value: 'satuan_pendidikan', label: 'Satuan Pendidikan' },
  { value: 'peserta_didik', label: 'Peserta Didik' },
  { value: 'guru', label: 'Guru' },
  { value: 'tendik', label: 'Tenaga Kependidikan' },
]

const periodModel = computed({
  get: () => statisticsData.value?.period ?? '',
  set: (val: string) => {
    if (statisticsData.value) {
      statisticsData.value.period = val
    }
  },
})

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const res = await api.get<{ data: StatisticsData }>('/admin/statistics')
    statisticsData.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function getCategoryTotal(category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik'): number {
  if (!statisticsData.value) return 0
  return statisticsData.value.categories[category].detail.reduce((sum, d) => sum + (d.value || 0), 0)
}

async function save(): Promise<void> {
  if (!statisticsData.value) return
  saving.value = true
  error.value = null
  try {
    const res = await api.put<{ data: StatisticsData; message: string }>('/admin/statistics', statisticsData.value)
    statisticsData.value = res.data
    successMessage.value = res.message || 'Data berhasil disimpan.'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}

function getDefaultDetail(category: string): StatisticsDetailItem {
  const detail: StatisticsDetailItem = { jenjang: '', value: 0, kabupaten: '' }
  if (category === 'guru' || category === 'tendik') {
    detail.pns = 0
    detail.non_pns = 0
  }
  if (category === 'peserta_didik') {
    detail.laki = 0
    detail.perempuan = 0
  }
  return detail
}

function startAdd(category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik'): void {
  editingCategoryKey.value = category
  editingIndex.value = -1
  editingDetail.value = getDefaultDetail(category)
  showModal.value = true
}

function startEdit(category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik', detail: StatisticsDetailItem, index: number): void {
  editingCategoryKey.value = category
  editingIndex.value = index
  editingDetail.value = { ...detail }
  showModal.value = true
}

function saveDetail(): void {
  if (!statisticsData.value || !editingCategoryKey.value || !editingDetail.value) return
  const catData = statisticsData.value.categories[editingCategoryKey.value]
  if (editingIndex.value >= 0) {
    catData.detail[editingIndex.value] = { ...editingDetail.value }
  } else {
    catData.detail.push({ ...editingDetail.value })
  }
  catData.total = catData.detail.reduce((sum, d) => sum + (d.value || 0), 0)
  showModal.value = false
  editingDetail.value = null
  editingCategoryKey.value = null
  editingIndex.value = -1
}

function kabupatenLabel(value: string | undefined): string {
  if (!value) return ''
  const found = kabupatenList.find((k) => k.value === value)
  return found?.label ?? value
}

const isJumlahReadonly = computed(() => {
  if (!editingCategoryKey.value) return false
  return ['peserta_didik', 'guru', 'tendik'].includes(editingCategoryKey.value)
})

const calculatedValue = computed(() => {
  if (!editingDetail.value || !editingCategoryKey.value) return 0
  const d = editingDetail.value
  if (editingCategoryKey.value === 'peserta_didik') {
    return (d.laki || 0) + (d.perempuan || 0)
  }
  if (['guru', 'tendik'].includes(editingCategoryKey.value)) {
    return (d.pns || 0) + (d.non_pns || 0)
  }
  return d.value || 0
})

watch(
  [
    () => editingDetail.value?.laki,
    () => editingDetail.value?.perempuan,
    () => editingDetail.value?.pns,
    () => editingDetail.value?.non_pns,
  ],
  () => {
    if (!editingDetail.value) return
    editingDetail.value.value = calculatedValue.value
  },
  { immediate: true }
)

function removeDetail(category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik', index: number): void {
  if (!statisticsData.value) return
  const catData = statisticsData.value.categories[category]
  catData.detail.splice(index, 1)
  catData.total = catData.detail.reduce((sum, d) => sum + (d.value || 0), 0)
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Kelola Statistik</h1>
        <p class="mt-1 text-sm text-muted">Edit data statistik Dapodik per kategori dan jenjang.</p>
      </div>
      <UButton v-if="successMessage" :color="successMessage ? 'success' : 'primary'" :loading="saving" @click="save">
        {{ successMessage ? 'Disimpan' : 'Simpan' }}
      </UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-4" />
    <UAlert v-if="successMessage" color="success" variant="soft" :title="successMessage" class="mb-4" />

    <UCard class="mb-6">
      <UFormField label="Periode">
        <UInput v-model="periodModel" placeholder="mis. 2026/2027 Ganjil" class="w-full sm:w-1/2" />
      </UFormField>
    </UCard>

    <div class="flex flex-wrap gap-2 mb-6">
      <UButton
        v-for="cat in categories"
        :key="cat.value"
        :color="activeCategory === cat.value ? 'primary' : 'neutral'"
        :variant="activeCategory === cat.value ? 'solid' : 'subtle'"
        @click="activeCategory = cat.value as any"
      >
        {{ cat.label }}
      </UButton>
    </div>

    <UCard v-if="loading" class="py-8 text-center">
      <UPSpinner />
      <p class="mt-2 text-sm text-muted">Memuat data...</p>
    </UCard>

    <template v-else-if="statisticsData">
      <UCard v-for="(catData, catKey) in statisticsData.categories" v-show="activeCategory === catKey" :key="catKey" class="mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold">{{ catData.label }}</h2>
            <span class="text-lg font-bold text-primary">
              Total: {{ getCategoryTotal(catKey).toLocaleString('id-ID') }}
            </span>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800 text-left">
                <th class="pb-2 font-medium">Jenjang</th>
                <th class="pb-2 font-medium">Jumlah</th>
                <th v-if="catKey === 'peserta_didik'" class="pb-2 font-medium">Laki-laki</th>
                <th v-if="catKey === 'peserta_didik'" class="pb-2 font-medium">Perempuan</th>
                <th v-if="catKey === 'guru' || catKey === 'tendik'" class="pb-2 font-medium">PNS</th>
                <th v-if="catKey === 'guru' || catKey === 'tendik'" class="pb-2 font-medium">Non-PNS</th>
                <th class="pb-2 font-medium">Kabupaten</th>
                <th class="pb-2 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(detail, idx) in catData.detail"
                :key="idx"
                class="border-b border-gray-200 dark:border-gray-800"
              >
                <td class="py-2">{{ detail.jenjang || '-' }}</td>
                <td class="py-2">{{ detail.value || 0 }}</td>
                <td v-if="catKey === 'peserta_didik'" class="py-2">{{ detail.laki || 0 }}</td>
                <td v-if="catKey === 'peserta_didik'" class="py-2">{{ detail.perempuan || 0 }}</td>
                <td v-if="catKey === 'guru' || catKey === 'tendik'" class="py-2">{{ detail.pns || 0 }}</td>
                <td v-if="catKey === 'guru' || catKey === 'tendik'" class="py-2">{{ detail.non_pns || 0 }}</td>
                <td class="py-2">{{ kabupatenLabel(detail.kabupaten) || '-' }}</td>
                <td class="py-2">
                  <div class="flex gap-1 justify-end">
                    <UButton
                      icon="i-lucide-edit-3"
                      size="xs"
                      variant="ghost"
                      color="primary"
                      aria-label="Ubah"
                      @click="startEdit(catKey, detail, idx)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      size="xs"
                      square
                      color="error"
                      variant="soft"
                      aria-label="Hapus"
                      @click="removeDetail(catKey, idx)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4">
          <UButton @click="startAdd(catKey)">
            <template #prepend>
              <i-lucide-plus class="size-4" />
            </template>
            Tambah Rincian
          </UButton>
        </div>
      </UCard>
    </template>

    <p v-else class="text-center text-muted py-8">Data belum tersedia.</p>

    <UModal
      v-model:open="showModal"
      :title="editingIndex >= 0 ? 'Edit Data Statistik' : 'Tambah Data Statistik'"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-lg' }"
      @close="editingDetail = null"
    >
      <template #body>
        <div v-if="editingDetail && editingCategoryKey" class="space-y-3">
          <UFormField label="Jenjang">
            <UInput v-model="editingDetail.jenjang" placeholder="mis. SMA" class="w-full" />
          </UFormField>

          <template v-if="editingCategoryKey === 'guru' || editingCategoryKey === 'tendik'">
            <div class="grid gap-3 sm:grid-cols-2">
              <UFormField label="PNS">
                <UInput v-model.number="editingDetail.pns" type="number" min="0" class="w-full" />
              </UFormField>
              <UFormField label="Non-PNS">
                <UInput v-model.number="editingDetail.non_pns" type="number" min="0" class="w-full" />
              </UFormField>
            </div>
          </template>

          <template v-else-if="editingCategoryKey === 'peserta_didik'">
            <div class="grid gap-3 sm:grid-cols-2">
              <UFormField label="Laki-laki">
                <UInput v-model.number="editingDetail.laki" type="number" min="0" class="w-full" />
              </UFormField>
              <UFormField label="Perempuan">
                <UInput v-model.number="editingDetail.perempuan" type="number" min="0" class="w-full" />
              </UFormField>
            </div>
          </template>

          <UFormField label="Jumlah">
            <div class="relative">
              <UInput
                v-model.number="editingDetail.value"
                :readonly="isJumlahReadonly"
                type="number"
                min="0"
                class="w-full"
              />
              <UIcon
                v-if="isJumlahReadonly"
                name="i-lucide-info"
                class="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted"
                title="Diitung otomatis dari penjumlahan"
              />
            </div>
          </UFormField>

          <UFormField label="Kabupaten">
            <USelect
              v-model="editingDetail.kabupaten"
              :items="kabupatenList"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex gap-2 justify-end">
          <UButton variant="ghost" color="neutral" @click="close">Batal</UButton>
          <UButton color="primary" @click="saveDetail">Simpan</UButton>
        </div>
      </template>
    </UModal>

    <div class="mt-6 flex justify-end">
      <UButton :loading="saving" @click="save">Simpan Semua Perubahan</UButton>
    </div>
  </div>
</template>
