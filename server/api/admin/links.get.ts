import { asc } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { infoLinks } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/links
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().query.infoLinks.findMany({
    orderBy: [asc(infoLinks.sortOrder), asc(infoLinks.id)],
  })
  return { data: rows }
})
