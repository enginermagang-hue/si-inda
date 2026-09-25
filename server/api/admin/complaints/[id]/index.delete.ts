import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { complaints } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { deleteStoredFile } from '../../../../utils/storage'

// DELETE /api/admin/complaints/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const existing = await useDb().query.complaints.findFirst({
    where: eq(complaints.id, id),
    columns: { filePath: true, dropboxPath: true },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Pengaduan tidak ditemukan.' })
  if (existing.filePath || existing.dropboxPath) {
    await deleteStoredFile(existing.filePath, existing.dropboxPath)
  }
  const rows = await useDb().delete(complaints).where(eq(complaints.id, id)).returning({ id: complaints.id })
  if (!rows.length) throw createError({ statusCode: 404, message: 'Pengaduan tidak ditemukan.' })
  return { message: 'Pengaduan dihapus.' }
})
