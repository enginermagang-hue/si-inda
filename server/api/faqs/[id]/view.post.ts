import { eq, sql } from 'drizzle-orm'
import { useDb } from '../../../utils/db'
import { faqs } from '../../../db/schema'

// POST /api/faqs/:id/view — tambah viewCount
export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, message: 'ID tidak valid.' })
  await useDb()
    .update(faqs)
    .set({ viewCount: sql`${faqs.viewCount} + 1` })
    .where(eq(faqs.id, id))
  return { ok: true }
})
