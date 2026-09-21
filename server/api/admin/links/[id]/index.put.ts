import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { infoLinks } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { clean, readJsonBody, toInt01 } from '../../../../utils/validate'

// PUT /api/admin/links/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const b = await readJsonBody(event)
  if (!b) throw createError({ statusCode: 400, message: 'Body harus JSON object.' })
  const patch: Partial<typeof infoLinks.$inferInsert> = {}
  if (b.title !== undefined) {
    const title = clean(b.title, 200)
    if (!title) throw createError({ statusCode: 400, message: 'title tidak valid.' })
    patch.title = title
  }
  if (b.url !== undefined) {
    const url = clean(b.url, 2000)
    if (!url || !/^https?:\/\//i.test(url)) throw createError({ statusCode: 400, message: 'url tidak valid.' })
    patch.url = url
  }
  if (b.isPublished !== undefined) patch.isPublished = toInt01(b.isPublished)
  if (b.sortOrder !== undefined && Number.isInteger(Number(b.sortOrder))) patch.sortOrder = Number(b.sortOrder)
  const rows = await useDb().update(infoLinks).set(patch).where(eq(infoLinks.id, id)).returning()
  if (!rows.length) throw createError({ statusCode: 404, message: 'Link tidak ditemukan.' })
  return { data: rows[0] }
})
