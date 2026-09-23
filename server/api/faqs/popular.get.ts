import { desc, eq, sql } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { faqSearchLogs, faqs } from '../../db/schema'

// GET /api/faqs/popular?limit=5 — FAQ paling dibuka + kata kunci paling dicari
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const limit = Math.min(Math.max(Number(q.limit) || 5, 1), 10)
  const db = useDb()
  const popularFaqs = await db.query.faqs.findMany({
    where: eq(faqs.isPublished, 1),
    orderBy: [desc(faqs.viewCount), desc(faqs.id)],
    limit,
  })
  const popularKeywords = await db
    .select({ keyword: faqSearchLogs.keyword, count: sql<number>`count(*)` })
    .from(faqSearchLogs)
    .groupBy(faqSearchLogs.keyword)
    .orderBy(desc(sql`count(*)`))
    .limit(limit)
  const categories = await db
    .selectDistinct({ category: faqs.category })
    .from(faqs)
    .where(eq(faqs.isPublished, 1))
  return {
    data: {
      popularFaqs,
      popularKeywords,
      categories: categories.map((c) => c.category),
    },
  }
})
