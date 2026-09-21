import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { letters } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { deleteStoredFile } from '../../../../utils/storage'

// DELETE /api/admin/letters/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const rows = await useDb().delete(letters).where(eq(letters.id, id)).returning()
  if (!rows.length) throw createError({ statusCode: 404, message: 'Surat tidak ditemukan.' })
  await deleteStoredFile(rows[0]?.filePath, rows[0]?.dropboxPath)
  return { message: 'Surat dihapus.' }
})
