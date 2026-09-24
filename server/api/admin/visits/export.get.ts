import { sql } from 'drizzle-orm'
import { useDb } from '../../../utils/db'
import { visits } from '../../../db/schema'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const range = typeof query.range === 'string' ? query.range : '30d'
  const daysMap: Record<string, number | null> = { '7d': 7, '30d': 30, '90d': 90, all: null }
  const days = daysMap[range] ?? 30
  const db = useDb()

  const where = days ? sql`date(${visits.createdAt}) >= date('now', ${`-${days - 1} days`})` : undefined
  const rows = await db
    .select({
      date: sql<string>`date(${visits.createdAt})`,
      hits: sql<number>`count(*)`,
      uniques: sql<number>`count(distinct ${visits.visitorId})`,
    })
    .from(visits)
    .where(where)
    .groupBy(sql`date(${visits.createdAt})`)
    .orderBy(sql`date(${visits.createdAt})`)

  const header = 'date,hits,uniques\n'
  const csv = header + rows.map(r => `${r.date},${r.hits},${r.uniques}`).join('\n')
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="visits-${range}.csv"`)
  return csv
})
