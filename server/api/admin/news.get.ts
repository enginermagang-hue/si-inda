import { desc, eq, asc } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { breakingNews, breakingNewsImages } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/news
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().query.breakingNews.findMany({
    orderBy: [desc(breakingNews.publishedAt)],
  })

  const result = await Promise.all(
    rows.map(async (row) => {
      const images = await useDb()
        .select()
        .from(breakingNewsImages)
        .where(eq(breakingNewsImages.newsId, row.id))
        .orderBy(asc(breakingNewsImages.sortOrder))
      return { ...row, images }
    }),
  )
  return { data: result }
})
