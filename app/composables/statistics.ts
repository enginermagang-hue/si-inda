import type { StatisticsData } from '~/../server/utils/statistics'

export const useStatistics = defineStore('statistics', () => {
  const data = ref<StatisticsData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<string | null>(null)

  async function fetchStatistics(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch('/api/statistics') as { data: StatisticsData; period: string; updated_at: string }
      data.value = res.data
      lastUpdated.value = res.updated_at || new Date().toISOString()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Gagal memuat data statistik'
    } finally {
      loading.value = false
    }
  }

  async function refreshStatistics(): Promise<void> {
    await fetchStatistics()
  }

  async function updateStatistics(newData: StatisticsData): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch('/api/admin/statistics', {
        method: 'PUT',
        body: newData,
        credentials: 'include',
      }) as { data: StatisticsData; message: string }
      data.value = res.data
      lastUpdated.value = new Date().toISOString()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Gagal menyimpan data statistik'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    lastUpdated,
    fetchStatistics,
    refreshStatistics,
    updateStatistics,
  }
})
