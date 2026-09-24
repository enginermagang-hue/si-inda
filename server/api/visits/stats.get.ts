import { sql } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { visits } from '../../db/schema'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60')
  const db = useDb()
  const totalRow = await db.select({ c: sql<number>`count(*)` }).from(visits).then(r => r[0])
  const todayRow = await db.select({ c: sql<number>`count(*)` }).from(visits).where(sql`date(${visits.createdAt}) = date('now')`).then(r => r[0])
  const todayUniqRow = await db.select({ c: sql<number>`count(distinct ${visits.visitorId})` }).from(visits).where(sql`date(${visits.createdAt}) = date('now')`).then(r => r[0])
  const onlineRow = await db.select({ c: sql<number>`count(distinct ${visits.visitorId})` }).from(visits).where(sql`${visits.createdAt} > datetime('now', '-5 minutes')`).then(r => r[0])

  return {
    data: {
      total: totalRow?.c ?? 0,
      today: todayRow?.c ?? 0,
      todayUniques: todayUniqRow?.c ?? 0,
      online: onlineRow?.c ?? 0,
    },
  }
})
