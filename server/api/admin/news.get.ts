import { desc } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { breakingNews } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/news
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().query.breakingNews.findMany({
    orderBy: [desc(breakingNews.publishedAt)],
  })
  return { data: rows }
})
