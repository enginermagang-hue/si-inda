import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { sops } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { deleteStoredFile } from '../../../../utils/storage'

// DELETE /api/admin/sops/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const rows = await useDb().delete(sops).where(eq(sops.id, id)).returning()
  if (!rows.length) throw createError({ statusCode: 404, message: 'SOP tidak ditemukan.' })
  await deleteStoredFile(rows[0]?.filePath, rows[0]?.dropboxPath)
  return { message: 'SOP dihapus.' }
})
