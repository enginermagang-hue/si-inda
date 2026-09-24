import { desc, eq, sql } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { letters } from '../db/schema'

// GET /api/letters?page=&limit= — surat yang dipublish (terbaru dulu)
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const rawPage = Number(q.page)
  const rawLimit = Number(q.limit)
  const hasPagination = q.page !== undefined || q.limit !== undefined

  const page = hasPagination ? Math.max(1, Number.isFinite(rawPage) ? Math.floor(rawPage) : 1) : 1
  const limit = hasPagination
    ? Math.min(Math.max(Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 9, 1), 50)
    : 0

  let total = 0
  if (hasPagination) {
    const countRes = await useDb()
      .select({ cnt: sql<number>`count(*)` })
      .from(letters)
      .where(eq(letters.isPublished, 1))
    total = Number(countRes[0]?.cnt ?? 0)
  }

  const totalPages = hasPagination && limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1
  const safePage = hasPagination ? Math.min(page, totalPages) : 1
  const offset = hasPagination ? (safePage - 1) * limit : 0

  const rows = await useDb().query.letters.findMany({
    where: eq(letters.isPublished, 1),
    orderBy: [desc(letters.tanggalSurat), desc(letters.id)],
    ...(hasPagination ? { limit, offset } : {}),
  })

  if (!hasPagination) {
    const countRes = await useDb()
      .select({ cnt: sql<number>`count(*)` })
      .from(letters)
      .where(eq(letters.isPublished, 1))
    total = Number(countRes[0]?.cnt ?? rows.length)
  }

  if (hasPagination) {
    return { data: rows, meta: { total, page: safePage, limit, totalPages } }
  }
  return { data: rows, meta: { total, page: 1, limit: total, totalPages: 1 } }
})
