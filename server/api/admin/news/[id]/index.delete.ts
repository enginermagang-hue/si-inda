import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { breakingNews } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'

// DELETE /api/admin/news/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const rows = await useDb().delete(breakingNews).where(eq(breakingNews.id, id)).returning({ id: breakingNews.id })
  if (!rows.length) throw createError({ statusCode: 404, message: 'Berita tidak ditemukan.' })
  return { message: 'Berita dihapus.' }
})
