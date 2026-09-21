import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { statistics } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'

// DELETE /api/admin/statistics/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const rows = await useDb().delete(statistics).where(eq(statistics.id, id)).returning({ id: statistics.id })
  if (!rows.length) throw createError({ statusCode: 404, message: 'Data tidak ditemukan.' })
  return { message: 'Data dihapus.' }
})
