import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { infoLinks } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'

// DELETE /api/admin/links/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const rows = await useDb().delete(infoLinks).where(eq(infoLinks.id, id)).returning({ id: infoLinks.id })
  if (!rows.length) throw createError({ statusCode: 404, message: 'Link tidak ditemukan.' })
  return { message: 'Link dihapus.' }
})
