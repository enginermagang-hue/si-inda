import { sql, desc } from 'drizzle-orm'
import { useDb } from '../../../utils/db'
import { visits } from '../../../db/schema'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const range = typeof query.range === 'string' ? query.range : '7d' // 7d | 30d | 90d | all
  const daysMap: Record<string, number | null> = { '7d': 7, '30d': 30, '90d': 90, all: null }
  const days = daysMap[range] ?? 7
  const db = useDb()

  const totalRow = await db.select({ c: sql<number>`count(*)` }).from(visits).then(r => r[0])
  const todayRow = await db.select({ c: sql<number>`count(*)` }).from(visits).where(sql`date(${visits.createdAt}) = date('now')`).then(r => r[0])
  const todayUniqRow = await db.select({ c: sql<number>`count(distinct ${visits.visitorId})` }).from(visits).where(sql`date(${visits.createdAt}) = date('now')`).then(r => r[0])
  const onlineRow = await db.select({ c: sql<number>`count(distinct ${visits.visitorId})` }).from(visits).where(sql`${visits.createdAt} > datetime('now', '-5 minutes')`).then(r => r[0])
  const uniqTotalRow = await db.select({ c: sql<number>`count(distinct ${visits.visitorId})` }).from(visits).then(r => r[0])

  // daily hits
  const dailyWhere = days ? sql`date(${visits.createdAt}) >= date('now', ${`-${days - 1} days`})` : undefined
  const daily = await db
    .select({ date: sql<string>`date(${visits.createdAt})`, hits: sql<number>`count(*)`, uniques: sql<number>`count(distinct ${visits.visitorId})` })
    .from(visits)
    .where(dailyWhere)
    .groupBy(sql`date(${visits.createdAt})`)
    .orderBy(sql`date(${visits.createdAt})`)

  // top pages
  const topPages = await db
    .select({ path: visits.path, hits: sql<number>`count(*)` })
    .from(visits)
    .where(dailyWhere)
    .groupBy(visits.path)
    .orderBy(desc(sql`count(*)`))
    .limit(10)

  // top referers
  const topReferers = await db
    .select({ referer: visits.referer, hits: sql<number>`count(*)` })
    .from(visits)
    .where(dailyWhere ? sql`${dailyWhere} AND ${visits.referer} IS NOT NULL` : sql`${visits.referer} IS NOT NULL`)
    .groupBy(visits.referer)
    .orderBy(desc(sql`count(*)`))
    .limit(10)

  // top countries
  const topCountries = await db
    .select({ country: visits.country, hits: sql<number>`count(*)` })
    .from(visits)
    .where(dailyWhere ? sql`${dailyWhere} AND ${visits.country} IS NOT NULL` : sql`${visits.country} IS NOT NULL`)
    .groupBy(visits.country)
    .orderBy(desc(sql`count(*)`))
    .limit(10)

  // recent 50
  const recent = await db.query.visits.findMany({
    orderBy: [desc(visits.id)],
    limit: 50,
  })

  return {
    data: {
      total: totalRow?.c ?? 0,
      today: todayRow?.c ?? 0,
      todayUniques: todayUniqRow?.c ?? 0,
      online: onlineRow?.c ?? 0,
      uniquesTotal: uniqTotalRow?.c ?? 0,
      daily,
      topPages,
      topReferers,
      topCountries,
      recent,
    },
  }
})
