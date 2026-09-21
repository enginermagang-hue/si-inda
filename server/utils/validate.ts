// Tipe event server (diambil dari helper h3 auto-import agar selalu cocok
// dengan versi h3 yang dipakai Nitro — jangan import type dari 'h3').
export type ServerEvent = Parameters<typeof readBody>[0]

export const toInt01 = (v: unknown): number => (v === 1 || v === '1' || v === true ? 1 : 0)

export function clean(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t && t.length <= max ? t : null
}

/** Baca body JSON dengan aman: tidak valid → null (caller me-return 400). */
export async function readJsonBody(event: ServerEvent): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await readBody(event)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export const STAT_CATEGORIES = ['satuan_pendidikan', 'peserta_didik', 'guru', 'tendik'] as const
export type StatCategory = (typeof STAT_CATEGORIES)[number]

export const MENU_GROUPS = ['ptk', 'peserta_didik', 'sarana'] as const

export const COMPLAINT_CATEGORIES = [
  'NUPTK',
  'Mutasi PTK',
  'Penambahan PTK',
  'Mutasi Peserta Didik',
  'Residu Peserta Didik',
  'Sarana Prasarana',
  'Aplikasi / Teknis',
  'Lainnya',
]

export const COMPLAINT_STATUS = ['baru', 'diproses', 'selesai'] as const
