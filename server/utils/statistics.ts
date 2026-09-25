import { useDb } from './db'
import { settings } from '../db/schema'

export interface StatisticsDetailItem {
  jenjang: string
  value: number
  pns?: number
  non_pns?: number
  laki?: number
  perempuan?: number
  kabupaten?: string
}

export interface StatisticsCategory {
  label: string
  total: number
  detail: StatisticsDetailItem[]
}

export interface StatisticsData {
  period: string
  updated_at: string
  categories: Record<'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik', StatisticsCategory>
}

/** Key settings untuk menyimpan data statistik sebagai JSON di tabel settings. */
const STATISTICS_KEY = 'statistics_data'

/** Baca data statistics dari database (tabel settings). Fallback ke default jika belum ada. */
export async function readStatistics(): Promise<StatisticsData> {
  try {
    const row = await useDb().query.settings.findFirst({
      where: (s, { eq }) => eq(s.key, STATISTICS_KEY),
    })
    if (!row) return getDefaultStatisticsData()
    try {
      return JSON.parse(row.value) as StatisticsData
    } catch {
      console.error('[Statistics] Error parsing JSON value:', row.value)
      return getDefaultStatisticsData()
    }
  } catch (e) {
    console.error('[Statistics] Error reading from DB:', e)
    return getDefaultStatisticsData()
  }
}

/** Simpan data statistics ke database (tabel settings) via upsert. */
export async function writeStatistics(data: StatisticsData): Promise<void> {
  const jsonStr = JSON.stringify(data, null, 2)
  await useDb()
    .insert(settings)
    .values({ key: STATISTICS_KEY, value: jsonStr })
    .onConflictDoUpdate({ target: settings.key, set: { value: jsonStr } })
}

/** Return default statistics data untuk initial seed. */
export function getDefaultStatisticsData(): StatisticsData {
  const now = new Date().toISOString()
  return {
    period: '2026/2027 Ganjil',
    updated_at: now,
    categories: {
      satuan_pendidikan: {
        label: 'Jumlah Satuan Pendidikan',
        total: 0,
        detail: [
          { jenjang: 'SMA', value: 0, kabupaten: '' },
          { jenjang: 'SMK', value: 0, kabupaten: '' },
          { jenjang: 'SLB', value: 0, kabupaten: '' },
        ],
      },
      peserta_didik: {
        label: 'Jumlah Peserta Didik',
        total: 0,
        detail: [
          { jenjang: 'SMA', value: 0, laki: 0, perempuan: 0, kabupaten: '' },
          { jenjang: 'SMK', value: 0, laki: 0, perempuan: 0, kabupaten: '' },
          { jenjang: 'SLB', value: 0, laki: 0, perempuan: 0, kabupaten: '' },
        ],
      },
      guru: {
        label: 'Jumlah Guru',
        total: 0,
        detail: [
          { jenjang: 'SMA', value: 0, pns: 0, non_pns: 0, kabupaten: '' },
          { jenjang: 'SMK', value: 0, pns: 0, non_pns: 0, kabupaten: '' },
          { jenjang: 'SLB', value: 0, pns: 0, non_pns: 0, kabupaten: '' },
        ],
      },
      tendik: {
        label: 'Jumlah Tenaga Kependidikan',
        total: 0,
        detail: [
          { jenjang: 'SMA', value: 0, pns: 0, non_pns: 0, kabupaten: '' },
          { jenjang: 'SMK', value: 0, pns: 0, non_pns: 0, kabupaten: '' },
          { jenjang: 'SLB', value: 0, pns: 0, non_pns: 0, kabupaten: '' },
        ],
      },
    },
  }
}
