import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { faqs } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'

// DELETE /api/admin/faqs/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, message: 'ID tidak valid.' })
  await useDb().delete(faqs).where(eq(faqs.id, id))
  return { ok: true }
})
