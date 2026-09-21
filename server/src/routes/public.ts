import { Hono } from 'hono'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import {
  breakingNews,
  complaints,
  contentPages,
  infoLinks,
  letters,
  settings,
  statistics,
} from '../db/schema.js'

const publicApi = new Hono()

const STAT_CATEGORIES = ['satuan_pendidikan', 'peserta_didik', 'guru', 'tendik'] as const

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t || t.length > max) return null
  return t
}

// GET /api/statistics[?category=guru] — hanya periode aktif (is_current=1)
publicApi.get('/statistics', async (c) => {
  const category = c.req.query('category')
  const where = category
    ? and(eq(statistics.isCurrent, 1), eq(statistics.category, category))
    : eq(statistics.isCurrent, 1)
  const rows = await db.query.statistics.findMany({
    where,
    orderBy: [asc(statistics.category), asc(statistics.id)],
  })
  return c.json({ categories: STAT_CATEGORIES, data: rows })
})

// GET /api/pages?group=ptk — daftar halaman per grup menu
publicApi.get('/pages', async (c) => {
  const group = c.req.query('group')
  const rows = await db.query.contentPages.findMany({
    where: group
      ? and(eq(contentPages.isPublished, 1), eq(contentPages.menuGroup, group))
      : eq(contentPages.isPublished, 1),
    orderBy: [asc(contentPages.sortOrder), asc(contentPages.id)],
    columns: { body: false },
  })
  return c.json({ data: rows })
})

// GET /api/pages/:slug — isi satu halaman "Syarat ..."
publicApi.get('/pages/:slug', async (c) => {
  const row = await db.query.contentPages.findFirst({
    where: and(eq(contentPages.slug, c.req.param('slug')), eq(contentPages.isPublished, 1)),
  })
  if (!row) return c.json({ error: 'Halaman tidak ditemukan.' }, 404)
  return c.json({ data: row })
})

// GET /api/letters — surat yang dipublish (terbaru dulu)
publicApi.get('/letters', async (c) => {
  const rows = await db.query.letters.findMany({
    where: eq(letters.isPublished, 1),
    orderBy: [desc(letters.tanggalSurat), desc(letters.id)],
  })
  return c.json({ data: rows })
})

// GET /api/links — link informasi
publicApi.get('/links', async (c) => {
  const rows = await db.query.infoLinks.findMany({
    where: eq(infoLinks.isPublished, 1),
    orderBy: [asc(infoLinks.sortOrder), asc(infoLinks.id)],
  })
  return c.json({ data: rows })
})

// GET /api/breaking-news — yang aktif & belum kedaluwarsa
publicApi.get('/breaking-news', async (c) => {
  const now = new Date().toISOString()
  const rows = await db.query.breakingNews.findMany({
    where: eq(breakingNews.isActive, 1),
    orderBy: [desc(breakingNews.publishedAt)],
  })
  const active = rows.filter((r) => !r.expiresAt || r.expiresAt >= now)
  return c.json({ data: active })
})

// GET /api/settings/public — hanya key yang aman untuk publik
const PUBLIC_SETTINGS = ['site_name', 'site_tagline', 'sop_drive_url', 'contact_wa', 'footer_text']
publicApi.get('/settings/public', async (c) => {
  const rows = await db.query.settings.findMany()
  const out: Record<string, string> = {}
  for (const r of rows) if (PUBLIC_SETTINGS.includes(r.key)) out[r.key] = r.value
  return c.json({ data: out })
})

const COMPLAINT_CATEGORIES = [
  'NUPTK',
  'Mutasi PTK',
  'Penambahan PTK',
  'Mutasi Peserta Didik',
  'Residu Peserta Didik',
  'Sarana Prasarana',
  'Aplikasi / Teknis',
  'Lainnya',
]

// POST /api/complaints — form pengaduan publik (tanpa akun)
publicApi.post('/complaints', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Body harus JSON.' }, 400)
  }
  const b = body as Record<string, unknown>
  const nama = str(b.nama, 100)
  const kontak = str(b.kontak, 100)
  const isi = str(b.isi, 2000)
  const kategori = typeof b.kategori === 'string' && b.kategori.trim() ? b.kategori.trim().slice(0, 50) : 'Lainnya'
  if (!nama) return c.json({ error: 'Nama wajib diisi (maks 100 karakter).' }, 400)
  if (!kontak) return c.json({ error: 'Kontak (WA/email) wajib diisi.' }, 400)
  if (!isi || isi.length < 10) return c.json({ error: 'Isi kendala minimal 10 karakter.' }, 400)
  const [row] = await db
    .insert(complaints)
    .values({ nama, kontak, kategori, isi, status: 'baru' })
    .returning({ id: complaints.id })
  return c.json({ message: 'Pengaduan terkirim. Nomor tiket Anda:', ticket: row.id }, 201)
})

export { publicApi, COMPLAINT_CATEGORIES, STAT_CATEGORIES }
