<script setup lang="ts">
import { api } from '~/composables/api'
import { kabupatenList } from '~/data/kabupaten'
import type { StatisticsData } from '~/../server/utils/statistics'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const statisticsData = ref<StatisticsData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const activeCategory = ref<'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik'>('satuan_pendidikan')
const period = ref('')
const successMessage = ref('')

const categories = [
  { value: 'satuan_pendidikan', label: 'Satuan Pendidikan' },
  { value: 'peserta_didik', label: 'Peserta Didik' },
  { value: 'guru', label: 'Guru' },
  { value: 'tendik', label: 'Tenaga Kependidikan' },
]

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const res = await api.get<{ data: StatisticsData }>('/admin/statistics')
    statisticsData.value = res.data
    period.value = res.data.period
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
    period.value = res.data.period
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

function updateCategoryDetail(
  category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik',
  index: number,
  field: keyof any,
  value: any,
): void {
  if (!statisticsData.value) return
  const catData = statisticsData.value.categories[category]
  const detail = catData.detail[index]
  if (detail) {
    // @ts-expect-error dynamic property access
    detail[field] = value
    // Recalculate total
    catData.total = catData.detail.reduce((sum, d) => sum + (d.value || 0), 0)
  }
}

function addDetail(category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik'): void {
  if (!statisticsData.value) return
  const catData = statisticsData.value.categories[category]
  const newDetail: any = { jenjang: '', value: 0, kabupaten: '' }
  if (category === 'guru' || category === 'tendik') {
    newDetail.pns = 0
    newDetail.non_pns = 0
  }
  if (category === 'peserta_didik') {
    newDetail.laki = 0
    newDetail.perempuan = 0
  }
  catData.detail.push(newDetail)
}

function removeDetail(category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik', index: number): void {
  if (!statisticsData.value) return
  const catData = statisticsData.value.categories[category]
  catData.detail.splice(index, 1)
  // Recalculate total
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
        <UInput v-model="period" placeholder="mis. 2026/2027 Ganjil" class="w-full sm:w-1/2" />
      </UFormField>
    </UCard>

    <div class="flex flex-wrap gap-2 mb-6">
      <UButton
        v-for="cat in categories"
        :key="cat.value"
        :color="activeCategory === cat.value ? 'primary' : 'neutral'"
        @click="activeCategory = cat.value as any"
      >
        {{ cat.label }}
      </UButton>
    </div>

    <UCard v-if="statisticsData && loading" class="py-8 text-center">
      <UPSpinner />
      <p class="mt-2 text-sm text-muted">Memuat data...</p>
    </UCard>

    <template v-else-if="statisticsData">
      <UCard v-for="(catData, catKey) in statisticsData.categories" :key="catKey" v-show="activeCategory === catKey" class="mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold">{{ catData.label }}</h2>
            <span class="text-lg font-bold text-primary">
              Total: {{ getCategoryTotal(catKey).toLocaleString('id-ID') }}
            </span>
          </div>
        </template>

        <div class="space-y-3">
          <div
            v-for="(detail, idx) in catData.detail"
            :key="idx"
            class="border rounded-lg p-4 bg-default"
          >
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <UFormField label="Jenjang">
                <UInput v-model="detail.jenjang" placeholder="mis. SMA" class="w-full" />
              </UFormField>

              <UFormField label="Jumlah">
                <UInput
                  v-model.number="detail.value"
                  type="number"
                  min="0"
                  class="w-full"
                />
              </UFormField>

              <template v-if="catKey === 'guru' || catKey === 'tendik'">
                <UFormField label="PNS">
                  <UInput
                    v-model.number="detail.pns"
                    type="number"
                    min="0"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Non-PNS">
                  <UInput
                    v-model.number="detail.non_pns"
                    type="number"
                    min="0"
                    class="w-full"
                  />
                </UFormField>
              </template>

              <template v-else-if="catKey === 'peserta_didik'">
                <UFormField label="Laki-laki">
                  <UInput
                    v-model.number="detail.laki"
                    type="number"
                    min="0"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Perempuan">
                  <UInput
                    v-model.number="detail.perempuan"
                    type="number"
                    min="0"
                    class="w-full"
                  />
                </UFormField>
              </template>

               <template v-if="catKey === 'satuan_pendidikan' || catKey === 'peserta_didik' || catKey === 'guru' || catKey === 'tendik'">
                  <UFormField label="Kabupaten">
                    <USelect
                      :items="kabupatenList"
                      value-key="value"
                      label-key="label"
                      v-model="detail.kabupaten"
                      class="w-full"
                    />
                  </UFormField>
                </template>
            </div>

            <div class="mt-3 flex justify-end">
              <UButton color="error" variant="soft" @click="removeDetail(catKey, idx)">
                Hapus
              </UButton>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <UButton @click="addDetail(catKey)">
            <template #prepend>
              <i-lucide-plus class="size-4" />
            </template>
            Tambah Rincian
          </UButton>
        </div>
      </UCard>
    </template>

    <p v-else class="text-center text-muted py-8">Data belum tersedia.</p>

    <div class="mt-6 flex justify-end">
      <UButton :loading="saving" @click="save">Simpan Semua Perubahan</UButton>
    </div>
  </div>
</template>
