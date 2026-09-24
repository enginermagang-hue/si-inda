import { desc, eq, asc, and, or, isNull, gte, like, sql } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { breakingNews, breakingNewsImages } from '../db/schema'

// GET /api/breaking-news?page=&limit=&q= — yang aktif & belum kedaluwarsa, terbaru dulu
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const rawPage = Number(q.page)
  const rawLimit = Number(q.limit)
  const hasPagination = q.page !== undefined || q.limit !== undefined
  const keyword = typeof q.q === 'string' ? q.q.trim().slice(0, 100) : ''

  const page = hasPagination ? Math.max(1, Number.isFinite(rawPage) ? Math.floor(rawPage) : 1) : 1
  const limit = hasPagination
    ? Math.min(Math.max(Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 9, 1), 50)
    : 0 // 0 = no pagination (return all, backward compat for homepage ticker)

  const now = new Date().toISOString()
  const whereActive = and(
    eq(breakingNews.isActive, 1),
    or(isNull(breakingNews.expiresAt), gte(breakingNews.expiresAt, now)),
    ...(keyword ? [or(like(breakingNews.title, `%${keyword}%`), like(breakingNews.body, `%${keyword}%`))!] : []),
  )

  // total for meta when paginated
  let total = 0
  if (hasPagination) {
    const countRes = await useDb()
      .select({ cnt: sql<number>`count(*)` })
      .from(breakingNews)
      .where(whereActive)
    total = Number(countRes[0]?.cnt ?? 0)
  }

  const totalPages = hasPagination && limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1
  const safePage = hasPagination ? Math.min(page, totalPages) : 1
  const offset = hasPagination ? (safePage - 1) * limit : 0

  const rows = await useDb().query.breakingNews.findMany({
    where: whereActive,
    orderBy: [desc(breakingNews.publishedAt), desc(breakingNews.id)],
    ...(hasPagination ? { limit, offset } : {}),
  })

  if (!hasPagination) {
    const allCountRes = await useDb()
      .select({ cnt: sql<number>`count(*)` })
      .from(breakingNews)
      .where(whereActive)
    total = Number(allCountRes[0]?.cnt ?? rows.length)
  }

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

  if (hasPagination) {
    return { data: result, meta: { total, page: safePage, limit, totalPages } }
  }
  return { data: result, meta: { total, page: 1, limit: total, totalPages: 1 } }
})
