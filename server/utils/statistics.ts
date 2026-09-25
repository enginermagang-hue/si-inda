import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/** Path ke file statistics JSON (di server/storage, diluar public/ agar tidak accessible langsung via URL). */
export function getStatisticsPath(): string {
  return join(process.cwd(), 'server', 'storage', 'statistics.json')
}

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

/** Baca data statistics dari JSON file. */
export function readStatistics(): StatisticsData {
  const path = getStatisticsPath()
  if (!existsSync(path)) {
    // Return default data jika file belum ada
    return getDefaultStatisticsData()
  }
  try {
    const content = readFileSync(path, 'utf-8')
    return JSON.parse(content) as StatisticsData
  } catch (e) {
    console.error('[Statistics] Error reading file:', e)
    return getDefaultStatisticsData()
  }
}

/** Simpan data statistics ke JSON file. */
export function writeStatistics(data: StatisticsData): void {
  const path = getStatisticsPath()
  // Pastikan direktori ada
  const dir = join(process.cwd(), 'server', 'storage')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  const jsonStr = JSON.stringify(data, null, 2)
  writeFileSync(path, jsonStr, 'utf-8')
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
