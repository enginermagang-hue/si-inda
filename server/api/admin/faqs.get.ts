import { asc } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { faqs } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/faqs
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().query.faqs.findMany({
    orderBy: [asc(faqs.sortOrder), asc(faqs.id)],
  })
  return { data: rows }
})
