import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { contentPages } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'

// DELETE /api/admin/pages/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const rows = await useDb().delete(contentPages).where(eq(contentPages.id, id)).returning({ id: contentPages.id })
  if (!rows.length) throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan.' })
  return { message: 'Halaman dihapus.' }
})
