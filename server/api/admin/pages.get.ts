import { asc } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { contentPages } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/pages
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().query.contentPages.findMany({
    orderBy: [asc(contentPages.menuGroup), asc(contentPages.sortOrder)],
  })
  return { data: rows }
})
