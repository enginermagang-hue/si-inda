import { asc, desc } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { statistics } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/statistics
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().query.statistics.findMany({
    orderBy: [asc(statistics.category), desc(statistics.id)],
  })
  return { data: rows }
})
