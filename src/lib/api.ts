/** Helper fetch ke API backend (same-origin; dev diproxy Vite ke :3001). */

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const text = await res.text()
  const data = (text ? JSON.parse(text) : {}) as T & { error?: string; message?: string }
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? `Request gagal (${res.status}).`)
  }
  return data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** POST multipart (upload PDF surat). */
  postForm: async <T>(path: string, form: FormData): Promise<T> => {
    const res = await fetch(`/api${path}`, { method: 'POST', body: form, credentials: 'include' })
    const data = (await res.json()) as T & { error?: string }
    if (!res.ok) throw new ApiError(res.status, data.error ?? `Upload gagal (${res.status}).`)
    return data
  },
  putForm: async <T>(path: string, form: FormData): Promise<T> => {
    const res = await fetch(`/api${path}`, { method: 'PUT', body: form, credentials: 'include' })
    const data = (await res.json()) as T & { error?: string }
    if (!res.ok) throw new ApiError(res.status, data.error ?? `Upload gagal (${res.status}).`)
    return data
  },
}

/* ---------- Tipe data API ---------- */

export interface Statistic {
  id: number
  category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik'
  jenjang: string | null
  label: string
  value: number
  period: string
  isCurrent: number
  updatedAt: string
}

export interface ContentPage {
  id: number
  slug: string
  menuGroup: 'ptk' | 'peserta_didik' | 'sarana'
  title: string
  body: string
  isPublished: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Letter {
  id: number
  nomorSurat: string
  judul: string
  tanggalSurat: string
  filePath: string | null
  isPublished: number
  createdAt: string
}

export interface InfoLink {
  id: number
  title: string
  url: string
  sortOrder: number
  isPublished: number
}

export interface NewsItem {
  id: number
  title: string
  body: string | null
  isActive: number
  publishedAt: string
  expiresAt: string | null
}

export interface Complaint {
  id: number
  nama: string
  kontak: string
  kategori: string
  isi: string
  status: 'baru' | 'diproses' | 'selesai'
  adminNote: string | null
  createdAt: string
  updatedAt: string
}

export interface PublicSettings {
  site_name: string
  site_tagline: string
  sop_drive_url: string
  contact_wa: string
  footer_text: string
}

export interface AdminMe {
  id: number
  name: string
  username: string
  mustChangePassword: boolean
}

export const STAT_META: Record<Statistic['category'], { title: string; subtitle: string; route: string }> = {
  satuan_pendidikan: {
    title: 'Jumlah Satuan Pendidikan',
    subtitle: 'Total satuan pendidikan terdata Dapodik',
    route: '/statistik/satuan-pendidikan',
  },
  peserta_didik: {
    title: 'Jumlah Peserta Didik',
    subtitle: 'Total peserta didik terdata Dapodik',
    route: '/statistik/peserta-didik',
  },
  guru: { title: 'Jumlah Guru', subtitle: 'Total guru terdata Dapodik', route: '/statistik/guru' },
  tendik: {
    title: 'Jumlah Tendik',
    subtitle: 'Total tenaga kependidikan terdata Dapodik',
    route: '/statistik/tendik',
  },
}

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
