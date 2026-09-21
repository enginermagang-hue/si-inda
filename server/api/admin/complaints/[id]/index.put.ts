import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { complaints } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { COMPLAINT_STATUS, readJsonBody } from '../../../../utils/validate'

// PUT /api/admin/complaints/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const b = await readJsonBody(event)
  if (!b) throw createError({ statusCode: 400, message: 'Body harus JSON object.' })
  const patch: Partial<typeof complaints.$inferInsert> = { updatedAt: new Date().toISOString() }
  if (b.status !== undefined) {
    if (!COMPLAINT_STATUS.includes(b.status as (typeof COMPLAINT_STATUS)[number])) {
      throw createError({ statusCode: 400, message: `status harus salah satu: ${COMPLAINT_STATUS.join(', ')}` })
    }
    patch.status = b.status as string
  }
  if (b.adminNote !== undefined) {
    patch.adminNote =
      typeof b.adminNote === 'string' && b.adminNote.trim() ? b.adminNote.slice(0, 2000) : null
  }
  const rows = await useDb().update(complaints).set(patch).where(eq(complaints.id, id)).returning()
  if (!rows.length) throw createError({ statusCode: 404, message: 'Pengaduan tidak ditemukan.' })
  return { data: rows[0] }
})
