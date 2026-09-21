import { Hono } from 'hono'
import type { Context } from 'hono'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import {
  admins,
  breakingNews,
  complaints,
  contentPages,
  infoLinks,
  letters,
  settings,
  statistics,
} from '../db/schema.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import {
  adminAuth,
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
  type AppEnv,
} from '../lib/auth.js'
import { deleteStoredFile, savePdfUpload } from '../lib/storage.js'
import { COMPLAINT_CATEGORIES, STAT_CATEGORIES } from './public.js'

const adminApi = new Hono<AppEnv>()

// ---------- Auth ----------

adminApi.post('/login', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Body harus JSON.' }, 400)
  }
  const { username, password } = body as { username?: unknown; password?: unknown }
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return c.json({ error: 'Username dan password wajib diisi.' }, 400)
  }
  const admin = await db.query.admins.findFirst({ where: eq(admins.username, username.trim()) })
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return c.json({ error: 'Username atau password salah.' }, 401)
  }
  const token = await createSessionToken(admin.id, admin.username)
  setSessionCookie(c, token)
  return c.json({
    data: {
      id: admin.id,
      name: admin.name,
      username: admin.username,
      mustChangePassword: admin.mustChangePassword === 1,
    },
  })
})

adminApi.post('/logout', (c) => {
  clearSessionCookie(c)
  return c.json({ message: 'Berhasil logout.' })
})

adminApi.use('/*', adminAuth)

adminApi.get('/me', async (c) => {
  const admin = c.get('admin')
  const row = await db.query.admins.findFirst({ where: eq(admins.id, admin.id) })
  return c.json({
    data: { ...admin, mustChangePassword: row ? row.mustChangePassword === 1 : false },
  })
})

adminApi.post('/change-password', async (c) => {
  const admin = c.get('admin')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Body harus JSON.' }, 400)
  }
  const { currentPassword, newPassword } = body as { currentPassword?: unknown; newPassword?: unknown }
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return c.json({ error: 'Password lama dan baru wajib diisi.' }, 400)
  }
  if (newPassword.length < 8) {
    return c.json({ error: 'Password baru minimal 8 karakter.' }, 400)
  }
  const row = await db.query.admins.findFirst({ where: eq(admins.id, admin.id) })
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    return c.json({ error: 'Password lama salah.' }, 400)
  }
  await db
    .update(admins)
    .set({ passwordHash: await hashPassword(newPassword), mustChangePassword: 0 })
    .where(eq(admins.id, admin.id))
  return c.json({ message: 'Password berhasil diganti.' })
})

// ---------- Helpers ----------

const toInt01 = (v: unknown): number => (v === 1 || v === '1' || v === true ? 1 : 0)
const clean = (v: unknown, max = 500): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t && t.length <= max ? t : null
}

/** Baca body JSON dengan aman: JSON rusak → 400 (bukan 500). */
async function parseJson(
  c: Context,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; res: Response }> {
  try {
    const parsed: unknown = await c.req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, res: c.json({ error: 'Body harus JSON object.' }, 400) }
    }
    return { ok: true, body: parsed as Record<string, unknown> }
  } catch {
    return { ok: false, res: c.json({ error: 'Body harus JSON valid.' }, 400) }
  }
}

// ---------- Statistik ----------

adminApi.get('/statistics', async (c) => {
  const rows = await db.query.statistics.findMany({ orderBy: [asc(statistics.category), desc(statistics.id)] })
  return c.json({ data: rows })
})

adminApi.post('/statistics', async (c) => {
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  if (!b || !STAT_CATEGORIES.includes(b.category as (typeof STAT_CATEGORIES)[number])) {
    return c.json({ error: `category harus salah satu: ${STAT_CATEGORIES.join(', ')}` }, 400)
  }
  const label = clean(b.label, 200)
  const period = clean(b.period, 50)
  const value = Number(b.value)
  if (!label || !period) return c.json({ error: 'label dan period wajib diisi.' }, 400)
  if (!Number.isInteger(value) || value < 0) return c.json({ error: 'value harus bilangan bulat ≥ 0.' }, 400)
  const jenjang = typeof b.jenjang === 'string' && b.jenjang.trim() ? b.jenjang.trim().slice(0, 50) : null
  const isCurrent = toInt01(b.isCurrent)
  if (isCurrent) {
    await db.update(statistics).set({ isCurrent: 0 }).where(eq(statistics.category, b.category as string))
  }
  const [row] = await db
    .insert(statistics)
    .values({ category: b.category as string, jenjang, label, value, period, isCurrent })
    .returning()
  return c.json({ data: row }, 201)
})

adminApi.put('/statistics/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  const patch: Partial<typeof statistics.$inferInsert> = { updatedAt: new Date().toISOString() }
  if (b.label !== undefined) {
    const label = clean(b.label, 200)
    if (!label) return c.json({ error: 'label tidak valid.' }, 400)
    patch.label = label
  }
  if (b.period !== undefined) {
    const period = clean(b.period, 50)
    if (!period) return c.json({ error: 'period tidak valid.' }, 400)
    patch.period = period
  }
  if (b.value !== undefined) {
    const value = Number(b.value)
    if (!Number.isInteger(value) || value < 0) return c.json({ error: 'value harus bilangan bulat ≥ 0.' }, 400)
    patch.value = value
  }
  if (b.jenjang !== undefined) {
    patch.jenjang = typeof b.jenjang === 'string' && b.jenjang.trim() ? b.jenjang.trim().slice(0, 50) : null
  }
  if (b.isCurrent !== undefined) {
    patch.isCurrent = toInt01(b.isCurrent)
    if (patch.isCurrent) {
      const current = await db.query.statistics.findFirst({ where: eq(statistics.id, id) })
      if (current) {
        await db.update(statistics).set({ isCurrent: 0 }).where(eq(statistics.category, current.category))
      }
    }
  }
  const rows = await db.update(statistics).set(patch).where(eq(statistics.id, id)).returning()
  if (!rows.length) return c.json({ error: 'Data tidak ditemukan.' }, 404)
  return c.json({ data: rows[0] })
})

adminApi.delete('/statistics/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const rows = await db.delete(statistics).where(eq(statistics.id, id)).returning({ id: statistics.id })
  if (!rows.length) return c.json({ error: 'Data tidak ditemukan.' }, 404)
  return c.json({ message: 'Data dihapus.' })
})

// ---------- Halaman konten ----------

const MENU_GROUPS = ['ptk', 'peserta_didik', 'sarana'] as const

adminApi.get('/pages', async (c) => {
  const rows = await db.query.contentPages.findMany({ orderBy: [asc(contentPages.menuGroup), asc(contentPages.sortOrder)] })
  return c.json({ data: rows })
})

adminApi.post('/pages', async (c) => {
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  const slug = clean(b.slug, 100)?.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const title = clean(b.title, 200)
  if (!slug || !title) return c.json({ error: 'slug dan title wajib diisi.' }, 400)
  if (!MENU_GROUPS.includes(b.menuGroup as (typeof MENU_GROUPS)[number])) {
    return c.json({ error: `menuGroup harus salah satu: ${MENU_GROUPS.join(', ')}` }, 400)
  }
  const exists = await db.query.contentPages.findFirst({ where: eq(contentPages.slug, slug) })
  if (exists) return c.json({ error: 'slug sudah dipakai.' }, 409)
  const [row] = await db
    .insert(contentPages)
    .values({
      slug,
      menuGroup: b.menuGroup as string,
      title,
      body: typeof b.body === 'string' ? b.body.slice(0, 100000) : '',
      isPublished: toInt01(b.isPublished ?? 1),
      sortOrder: Number.isInteger(Number(b.sortOrder)) ? Number(b.sortOrder) : 0,
    })
    .returning()
  return c.json({ data: row }, 201)
})

adminApi.put('/pages/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  const patch: Partial<typeof contentPages.$inferInsert> = { updatedAt: new Date().toISOString() }
  if (b.title !== undefined) {
    const title = clean(b.title, 200)
    if (!title) return c.json({ error: 'title tidak valid.' }, 400)
    patch.title = title
  }
  if (b.body !== undefined) {
    if (typeof b.body !== 'string') return c.json({ error: 'body harus string HTML.' }, 400)
    patch.body = b.body.slice(0, 100000)
  }
  if (b.isPublished !== undefined) patch.isPublished = toInt01(b.isPublished)
  if (b.sortOrder !== undefined && Number.isInteger(Number(b.sortOrder))) patch.sortOrder = Number(b.sortOrder)
  if (b.menuGroup !== undefined) {
    if (!MENU_GROUPS.includes(b.menuGroup as (typeof MENU_GROUPS)[number])) {
      return c.json({ error: 'menuGroup tidak valid.' }, 400)
    }
    patch.menuGroup = b.menuGroup as string
  }
  const rows = await db.update(contentPages).set(patch).where(eq(contentPages.id, id)).returning()
  if (!rows.length) return c.json({ error: 'Halaman tidak ditemukan.' }, 404)
  return c.json({ data: rows[0] })
})

adminApi.delete('/pages/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const rows = await db.delete(contentPages).where(eq(contentPages.id, id)).returning({ id: contentPages.id })
  if (!rows.length) return c.json({ error: 'Halaman tidak ditemukan.' }, 404)
  return c.json({ message: 'Halaman dihapus.' })
})

// ---------- Surat (upload PDF) ----------

adminApi.get('/letters', async (c) => {
  const rows = await db.query.letters.findMany({ orderBy: [desc(letters.id)] })
  return c.json({ data: rows })
})

async function readLetterForm(c: { req: { formData(): Promise<FormData> } }) {
  const form = await c.req.formData()
  const get = (k: string): string | null => {
    const v = form.get(k)
    return typeof v === 'string' && v.trim() ? v.trim() : null
  }
  const file = form.get('file')
  return {
    nomorSurat: get('nomor_surat'),
    judul: get('judul'),
    tanggalSurat: get('tanggal_surat'),
    isPublished: form.get('is_published') !== '0',
    file: file instanceof File && file.size > 0 ? file : null,
  }
}

adminApi.post('/letters', async (c) => {
  const f = await readLetterForm(c)
  if (!f.nomorSurat || !f.judul || !f.tanggalSurat) {
    return c.json({ error: 'nomor_surat, judul, dan tanggal_surat wajib diisi.' }, 400)
  }
  let filePath: string | null = null
  try {
    if (f.file) filePath = await savePdfUpload(f.file)
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Upload gagal.' }, 400)
  }
  const [row] = await db
    .insert(letters)
    .values({ nomorSurat: f.nomorSurat, judul: f.judul, tanggalSurat: f.tanggalSurat, filePath, isPublished: f.isPublished ? 1 : 0 })
    .returning()
  return c.json({ data: row }, 201)
})

adminApi.put('/letters/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const current = await db.query.letters.findFirst({ where: eq(letters.id, id) })
  if (!current) return c.json({ error: 'Surat tidak ditemukan.' }, 404)
  const f = await readLetterForm(c)
  const patch: Partial<typeof letters.$inferInsert> = {}
  if (f.nomorSurat) patch.nomorSurat = f.nomorSurat
  if (f.judul) patch.judul = f.judul
  if (f.tanggalSurat) patch.tanggalSurat = f.tanggalSurat
  patch.isPublished = f.isPublished ? 1 : 0
  try {
    if (f.file) {
      patch.filePath = await savePdfUpload(f.file)
      deleteStoredFile(current.filePath)
    }
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Upload gagal.' }, 400)
  }
  const rows = await db.update(letters).set(patch).where(eq(letters.id, id)).returning()
  return c.json({ data: rows[0] })
})

adminApi.delete('/letters/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const rows = await db.delete(letters).where(eq(letters.id, id)).returning()
  if (!rows.length) return c.json({ error: 'Surat tidak ditemukan.' }, 404)
  deleteStoredFile(rows[0].filePath)
  return c.json({ message: 'Surat dihapus.' })
})

// ---------- Link informasi ----------

adminApi.get('/links', async (c) => {
  const rows = await db.query.infoLinks.findMany({ orderBy: [asc(infoLinks.sortOrder), asc(infoLinks.id)] })
  return c.json({ data: rows })
})

adminApi.post('/links', async (c) => {
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  const title = clean(b.title, 200)
  const url = clean(b.url, 2000)
  if (!title || !url || !/^https?:\/\//i.test(url)) {
    return c.json({ error: 'title dan url (http(s)://...) wajib diisi.' }, 400)
  }
  const [row] = await db
    .insert(infoLinks)
    .values({
      title,
      url,
      sortOrder: Number.isInteger(Number(b.sortOrder)) ? Number(b.sortOrder) : 0,
      isPublished: toInt01(b.isPublished ?? 1),
    })
    .returning()
  return c.json({ data: row }, 201)
})

adminApi.put('/links/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  const patch: Partial<typeof infoLinks.$inferInsert> = {}
  if (b.title !== undefined) {
    const title = clean(b.title, 200)
    if (!title) return c.json({ error: 'title tidak valid.' }, 400)
    patch.title = title
  }
  if (b.url !== undefined) {
    const url = clean(b.url, 2000)
    if (!url || !/^https?:\/\//i.test(url)) return c.json({ error: 'url tidak valid.' }, 400)
    patch.url = url
  }
  if (b.isPublished !== undefined) patch.isPublished = toInt01(b.isPublished)
  if (b.sortOrder !== undefined && Number.isInteger(Number(b.sortOrder))) patch.sortOrder = Number(b.sortOrder)
  const rows = await db.update(infoLinks).set(patch).where(eq(infoLinks.id, id)).returning()
  if (!rows.length) return c.json({ error: 'Link tidak ditemukan.' }, 404)
  return c.json({ data: rows[0] })
})

adminApi.delete('/links/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const rows = await db.delete(infoLinks).where(eq(infoLinks.id, id)).returning({ id: infoLinks.id })
  if (!rows.length) return c.json({ error: 'Link tidak ditemukan.' }, 404)
  return c.json({ message: 'Link dihapus.' })
})

// ---------- Breaking news ----------

adminApi.get('/news', async (c) => {
  const rows = await db.query.breakingNews.findMany({ orderBy: [desc(breakingNews.publishedAt)] })
  return c.json({ data: rows })
})

adminApi.post('/news', async (c) => {
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  const title = clean(b.title, 300)
  if (!title) return c.json({ error: 'title wajib diisi.' }, 400)
  const [row] = await db
    .insert(breakingNews)
    .values({
      title,
      body: typeof b.body === 'string' ? b.body.slice(0, 5000) : null,
      isActive: toInt01(b.isActive ?? 1),
      expiresAt: typeof b.expiresAt === 'string' && b.expiresAt.trim() ? b.expiresAt.trim() : null,
    })
    .returning()
  return c.json({ data: row }, 201)
})

adminApi.put('/news/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  const patch: Partial<typeof breakingNews.$inferInsert> = {}
  if (b.title !== undefined) {
    const title = clean(b.title, 300)
    if (!title) return c.json({ error: 'title tidak valid.' }, 400)
    patch.title = title
  }
  if (b.body !== undefined) {
    patch.body = typeof b.body === 'string' && b.body.trim() ? b.body.slice(0, 5000) : null
  }
  if (b.isActive !== undefined) patch.isActive = toInt01(b.isActive)
  if (b.expiresAt !== undefined) {
    patch.expiresAt = typeof b.expiresAt === 'string' && b.expiresAt.trim() ? b.expiresAt.trim() : null
  }
  const rows = await db.update(breakingNews).set(patch).where(eq(breakingNews.id, id)).returning()
  if (!rows.length) return c.json({ error: 'Berita tidak ditemukan.' }, 404)
  return c.json({ data: rows[0] })
})

adminApi.delete('/news/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const rows = await db.delete(breakingNews).where(eq(breakingNews.id, id)).returning({ id: breakingNews.id })
  if (!rows.length) return c.json({ error: 'Berita tidak ditemukan.' }, 404)
  return c.json({ message: 'Berita dihapus.' })
})

// ---------- Pengaduan ----------

const COMPLAINT_STATUS = ['baru', 'diproses', 'selesai'] as const

adminApi.get('/complaints', async (c) => {
  const status = c.req.query('status')
  const rows = await db.query.complaints.findMany({
    where: status ? eq(complaints.status, status) : undefined,
    orderBy: [desc(complaints.id)],
  })
  return c.json({ data: rows })
})

adminApi.put('/complaints/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  const patch: Partial<typeof complaints.$inferInsert> = { updatedAt: new Date().toISOString() }
  if (b.status !== undefined) {
    if (!COMPLAINT_STATUS.includes(b.status as (typeof COMPLAINT_STATUS)[number])) {
      return c.json({ error: `status harus salah satu: ${COMPLAINT_STATUS.join(', ')}` }, 400)
    }
    patch.status = b.status as string
  }
  if (b.adminNote !== undefined) {
    patch.adminNote =
      typeof b.adminNote === 'string' && b.adminNote.trim() ? b.adminNote.slice(0, 2000) : null
  }
  const rows = await db.update(complaints).set(patch).where(eq(complaints.id, id)).returning()
  if (!rows.length) return c.json({ error: 'Pengaduan tidak ditemukan.' }, 404)
  return c.json({ data: rows[0] })
})

adminApi.delete('/complaints/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const rows = await db.delete(complaints).where(eq(complaints.id, id)).returning({ id: complaints.id })
  if (!rows.length) return c.json({ error: 'Pengaduan tidak ditemukan.' }, 404)
  return c.json({ message: 'Pengaduan dihapus.' })
})

// ---------- Pengaturan ----------

const EDITABLE_SETTINGS = ['site_name', 'site_tagline', 'sop_drive_url', 'contact_wa', 'footer_text']

adminApi.get('/settings', async (c) => {
  const rows = await db.query.settings.findMany()
  return c.json({ data: rows })
})

adminApi.put('/settings', async (c) => {
  const parsed = await parseJson(c)
  if (!parsed.ok) return parsed.res
  const b = parsed.body
  if (!b || typeof b !== 'object') return c.json({ error: 'Body harus JSON object.' }, 400)
  for (const [key, value] of Object.entries(b)) {
    if (!EDITABLE_SETTINGS.includes(key)) continue
    const v = typeof value === 'string' ? value.slice(0, 2000) : ''
    if (key === 'sop_drive_url' && v && !/^https?:\/\//i.test(v)) {
      return c.json({ error: 'sop_drive_url harus URL http(s):// atau dikosongkan.' }, 400)
    }
    await db.insert(settings).values({ key, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } })
  }
  const rows = await db.query.settings.findMany()
  return c.json({ data: rows })
})

export { adminApi, COMPLAINT_STATUS }
