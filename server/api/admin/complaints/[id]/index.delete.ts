import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { complaints } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'

// DELETE /api/admin/complaints/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const rows = await useDb().delete(complaints).where(eq(complaints.id, id)).returning({ id: complaints.id })
  if (!rows.length) throw createError({ statusCode: 404, message: 'Pengaduan tidak ditemukan.' })
  return { message: 'Pengaduan dihapus.' }
})
