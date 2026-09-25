import { writeStatistics, type StatisticsData, type StatisticsDetailItem } from '../../utils/statistics'
import { requireAdmin } from '../../utils/auth'
import { clean, readJsonBody } from '../../utils/validate'

interface IncomingDetail {
  jenjang?: unknown
  value?: unknown
  pns?: unknown
  non_pns?: unknown
  laki?: unknown
  perempuan?: unknown
  kabupaten?: unknown
}

interface IncomingCategory {
  label?: unknown
  detail?: IncomingDetail[]
}

// PUT /api/admin/statistics - Update full statistics data
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const b = await readJsonBody(event)
  if (!b) throw createError({ statusCode: 400, message: 'Body harus JSON object.' })

  // Validate required fields
  if (!b.period || typeof b.period !== 'string' || !b.period.trim()) {
    throw createError({ statusCode: 400, message: 'period wajib diisi.' })
  }
  if (!b.categories || typeof b.categories !== 'object') {
    throw createError({ statusCode: 400, message: 'categories wajib berupa object.' })
  }

  const period = clean(b.period, 50)!
  const now = new Date().toISOString()

  // Build new statistics data with proper typing
  const categories: StatisticsData['categories'] = {
    satuan_pendidikan: {
      label: 'Jumlah Satuan Pendidikan',
      total: 0,
      detail: [],
    },
    peserta_didik: {
      label: 'Jumlah Peserta Didik',
      total: 0,
      detail: [],
    },
    guru: {
      label: 'Jumlah Guru',
      total: 0,
      detail: [],
    },
    tendik: {
      label: 'Jumlah Tenaga Kependidikan',
      total: 0,
      detail: [],
    },
  }

  const validCategories = ['satuan_pendidikan', 'peserta_didik', 'guru', 'tendik'] as const

  for (const cat of validCategories) {
    const catData = (b.categories as Record<string, IncomingCategory | undefined>)[cat]
    if (!catData) {
      continue
    }
    if (typeof catData !== 'object' || !catData.label || typeof catData.label !== 'string') {
      throw createError({ statusCode: 400, message: `${cat}: label wajib diisi.` })
    }
    if (!Array.isArray(catData.detail)) {
      throw createError({ statusCode: 400, message: `${cat}: detail harus array.` })
    }

    // Calculate total from detail
    let total = 0
    const details: StatisticsDetailItem[] = []

    for (const d of catData.detail) {
      const value = Number(d.value)
      if (!Number.isInteger(value) || value < 0) {
        throw createError({ statusCode: 400, message: `${cat}: value harus bilangan bulat >= 0.` })
      }
      total += value

      // Validate detail item based on category
      const detailItem: StatisticsDetailItem = { jenjang: clean(d.jenjang, 50) || '', value }

      if (cat === 'guru' || cat === 'tendik') {
        const pns = d.pns != null ? Number(d.pns) : 0
        const nonPns = d.non_pns != null ? Number(d.non_pns) : 0
        if (!Number.isInteger(pns) || pns < 0 || !Number.isInteger(nonPns) || nonPns < 0) {
          throw createError({ statusCode: 400, message: `${cat}: pns dan non_pns harus bilangan bulat >= 0.` })
        }
        detailItem.pns = pns
        detailItem.non_pns = nonPns
      }

      if (cat === 'peserta_didik') {
        const laki = d.laki != null ? Number(d.laki) : 0
        const perempuan = d.perempuan != null ? Number(d.perempuan) : 0
        if (!Number.isInteger(laki) || laki < 0 || !Number.isInteger(perempuan) || perempuan < 0) {
          throw createError({ statusCode: 400, message: `${cat}: laki dan perempuan harus bilangan bulat >= 0.` })
        }
        detailItem.laki = laki
        detailItem.perempuan = perempuan
      }

      if (d.kabupaten !== undefined && typeof d.kabupaten === 'string') {
        detailItem.kabupaten = clean(d.kabupaten, 100) || ''
      }

      details.push(detailItem)
    }

    categories[cat] = {
      label: clean(catData.label, 200) || '',
      total,
      detail: details,
    }
  }

  const newData: StatisticsData = {
    period,
    updated_at: now,
    categories,
  }

  writeStatistics(newData)
  return { data: newData, message: 'Data statistik berhasil diperbarui.' }
})
