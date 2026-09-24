/** Wrapper $fetch untuk API same-origin + tipe data. */

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: { method?: string; body?: Record<string, unknown> }): Promise<T> {
  try {
    return (await $fetch(`/api${path}`, {
      credentials: 'include',
      ...init,
    })) as T
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status ?? 500
    const message =
      (e as { data?: { error?: string } })?.data?.error ??
      (e instanceof Error ? e.message : `Request gagal (${status}).`)
    throw new ApiError(status, message)
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: Record<string, unknown>) =>
    request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: Record<string, unknown>) =>
    request<T>(path, { method: 'PUT', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** POST multipart (upload PDF surat). */
  postForm: <T>(path: string, form: FormData) =>
    $fetch<T>(`/api${path}`, { method: 'POST', body: form, credentials: 'include' }).catch((e: unknown) => {
      throw toApiError(e)
    }),
  putForm: <T>(path: string, form: FormData) =>
    $fetch<T>(`/api${path}`, { method: 'PUT', body: form, credentials: 'include' }).catch((e: unknown) => {
      throw toApiError(e)
    }),
}

function toApiError(e: unknown): ApiError {
  const status = (e as { response?: { status?: number } })?.response?.status ?? 500
  const message =
    (e as { data?: { error?: string } })?.data?.error ??
    (e instanceof Error ? e.message : `Request gagal (${status}).`)
  return new ApiError(status, message)
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
  deskripsi: string | null
  filePath: string | null
  dropboxPath: string | null
  isPublished: number
  createdAt: string
}

export interface Sop {
  id: number
  judul: string
  deskripsi: string
  filePath: string | null
  dropboxPath: string | null
  isPublished: number
  createdAt: string
  updatedAt: string
}

export interface InfoLink {
  id: number
  title: string
  url: string
  sortOrder: number
  isPublished: number
}

export interface Faq {
  id: number
  question: string
  answer: string
  category: string
  sortOrder: number
  isPublished: number
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface FaqPopular {
  popularFaqs: Faq[]
  popularKeywords: Array<{ keyword: string; count: number }>
  categories: string[]
}

export interface NewsImage {
  id: number
  newsId: number
  filePath: string | null
  dropboxPath: string | null
  description: string | null
  sortOrder: number
  createdAt: string
}

export interface NewsItem {
  id: number
  title: string
  body: string | null
  isActive: number
  publishedAt: string
  expiresAt: string | null
  images: NewsImage[]
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

export interface ComplaintStatus {
  id: number
  kategori: string
  status: 'baru' | 'diproses' | 'selesai'
  adminNote: string | null
  createdAt: string
  updatedAt: string
}

export interface PublicSettings {
  site_name: string
  site_tagline: string
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
    route: '/statistik',
  },
  peserta_didik: {
    title: 'Jumlah Peserta Didik',
    subtitle: 'Total peserta didik terdata Dapodik',
    route: '/statistik',
  },
  guru: { title: 'Jumlah Guru', subtitle: 'Total guru terdata Dapodik', route: '/statistik' },
  tendik: {
    title: 'Jumlah Tendik',
    subtitle: 'Total tenaga kependidikan terdata Dapodik',
    route: '/statistik',
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
