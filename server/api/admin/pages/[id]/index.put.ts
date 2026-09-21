import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { contentPages } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { clean, MENU_GROUPS, readJsonBody, toInt01 } from '../../../../utils/validate'

// PUT /api/admin/pages/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const b = await readJsonBody(event)
  if (!b) throw createError({ statusCode: 400, message: 'Body harus JSON object.' })
  const patch: Partial<typeof contentPages.$inferInsert> = { updatedAt: new Date().toISOString() }
  if (b.title !== undefined) {
    const title = clean(b.title, 200)
    if (!title) throw createError({ statusCode: 400, message: 'title tidak valid.' })
    patch.title = title
  }
  if (b.body !== undefined) {
    if (typeof b.body !== 'string') throw createError({ statusCode: 400, message: 'body harus string HTML.' })
    patch.body = b.body.slice(0, 100000)
  }
  if (b.isPublished !== undefined) patch.isPublished = toInt01(b.isPublished)
  if (b.sortOrder !== undefined && Number.isInteger(Number(b.sortOrder))) patch.sortOrder = Number(b.sortOrder)
  if (b.menuGroup !== undefined) {
    if (!MENU_GROUPS.includes(b.menuGroup as (typeof MENU_GROUPS)[number])) {
      throw createError({ statusCode: 400, message: 'menuGroup tidak valid.' })
    }
    patch.menuGroup = b.menuGroup as string
  }
  const rows = await useDb().update(contentPages).set(patch).where(eq(contentPages.id, id)).returning()
  if (!rows.length) throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan.' })
  return { data: rows[0] }
})
