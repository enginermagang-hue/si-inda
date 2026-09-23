import { desc, sql } from 'drizzle-orm'
import { useDb } from '../../../utils/db'
import { faqSearchLogs, faqs } from '../../../db/schema'
import { requireAdmin } from '../../../utils/auth'

// GET /api/admin/faqs/stats — FAQ terpopuler + kata kunci teratas
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const topFaqs = await db.query.faqs.findMany({
    orderBy: [desc(faqs.viewCount)],
    limit: 20,
  })
  const topKeywords = await db
    .select({ keyword: faqSearchLogs.keyword, count: sql<number>`count(*)` })
    .from(faqSearchLogs)
    .groupBy(faqSearchLogs.keyword)
    .orderBy(desc(sql`count(*)`))
    .limit(20)
  return { data: { topFaqs, topKeywords } }
})
