import { and, asc, eq } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { statistics } from '../db/schema'
import { STAT_CATEGORIES } from '../utils/validate'

// GET /api/statistics[?category=guru] — hanya periode aktif (is_current=1)
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = typeof query.category === 'string' ? query.category : undefined
  const where = category
    ? and(eq(statistics.isCurrent, 1), eq(statistics.category, category))
    : eq(statistics.isCurrent, 1)
  const rows = await useDb().query.statistics.findMany({
    where,
    orderBy: [asc(statistics.category), asc(statistics.id)],
  })
  return { categories: STAT_CATEGORIES, data: rows }
})
