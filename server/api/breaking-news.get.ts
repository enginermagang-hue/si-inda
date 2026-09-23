import { desc, eq, asc } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { breakingNews, breakingNewsImages } from '../db/schema'

// GET /api/breaking-news — yang aktif & belum kedaluwarsa
export default defineEventHandler(async () => {
  const now = new Date().toISOString()
  const rows = await useDb().query.breakingNews.findMany({
    where: eq(breakingNews.isActive, 1),
    orderBy: [desc(breakingNews.publishedAt)],
  })
  const active = rows.filter((r) => !r.expiresAt || r.expiresAt >= now)

  const result = await Promise.all(
    active.map(async (row) => {
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
