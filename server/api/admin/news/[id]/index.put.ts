import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { breakingNews } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { clean, readJsonBody, toInt01 } from '../../../../utils/validate'

// PUT /api/admin/news/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const b = await readJsonBody(event)
  if (!b) throw createError({ statusCode: 400, message: 'Body harus JSON object.' })
  const patch: Partial<typeof breakingNews.$inferInsert> = {}
  if (b.title !== undefined) {
    const title = clean(b.title, 300)
    if (!title) throw createError({ statusCode: 400, message: 'title tidak valid.' })
    patch.title = title
  }
  if (b.body !== undefined) {
    patch.body = typeof b.body === 'string' && b.body.trim() ? b.body.slice(0, 5000) : null
  }
  if (b.isActive !== undefined) patch.isActive = toInt01(b.isActive)
  if (b.expiresAt !== undefined) {
    patch.expiresAt = typeof b.expiresAt === 'string' && b.expiresAt.trim() ? b.expiresAt.trim() : null
  }
  const rows = await useDb().update(breakingNews).set(patch).where(eq(breakingNews.id, id)).returning()
  if (!rows.length) throw createError({ statusCode: 404, message: 'Berita tidak ditemukan.' })
  return { data: rows[0] }
})
