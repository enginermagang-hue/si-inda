import { readStatistics, type StatisticsData } from '../utils/statistics'
import { STAT_CATEGORIES } from '../utils/validate'

// GET /api/statistics - Return public statistics data for display
// Return data as array for backward compatibility with pages/index.vue
export default defineEventHandler(async (event) => {
  const data = readStatistics()
  
  // Flatten categories into array format for backward compatibility
  const result: Statistic[] = []
  for (const cat of STAT_CATEGORIES) {
    const catData = data.categories[cat]
    // Add total row (jenjang null)
    result.push({
      id: 0,
      category: cat,
      jenjang: null,
      label: catData.label,
      value: catData.total,
      period: data.period,
      isCurrent: 1,
      updatedAt: data.updated_at,
    })
    // Add detail rows
    for (const d of catData.detail) {
      result.push({
        id: 0,
        category: cat,
        jenjang: d.jenjang,
        label: catData.label,
        value: d.value,
        period: data.period,
        isCurrent: 1,
        updatedAt: data.updated_at,
        kabupaten: d.kabupaten,
        pns: d.pns,
        non_pns: d.non_pns,
        laki: d.laki,
        perempuan: d.perempuan,
      })
    }
  }
  
  return {
    categories: STAT_CATEGORIES,
    period: data.period,
    updated_at: data.updated_at,
    data: result,
  }
})

