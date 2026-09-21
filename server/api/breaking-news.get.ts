import { desc, eq } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { breakingNews } from '../db/schema'

// GET /api/breaking-news — yang aktif & belum kedaluwarsa
export default defineEventHandler(async () => {
  const now = new Date().toISOString()
  const rows = await useDb().query.breakingNews.findMany({
    where: eq(breakingNews.isActive, 1),
    orderBy: [desc(breakingNews.publishedAt)],
  })
  return { data: rows.filter((r) => !r.expiresAt || r.expiresAt >= now) }
})
