import { desc, eq, and, or, like, sql } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { sops } from '../db/schema'

// GET /api/sops?page=&limit=&q= — SOP yang dipublish (terbaru dulu)
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const rawPage = Number(q.page)
  const rawLimit = Number(q.limit)
  const hasPagination = q.page !== undefined || q.limit !== undefined
  const keyword = typeof q.q === 'string' ? q.q.trim().slice(0, 100) : ''

  const page = hasPagination ? Math.max(1, Number.isFinite(rawPage) ? Math.floor(rawPage) : 1) : 1
  const limit = hasPagination
    ? Math.min(Math.max(Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 9, 1), 50)
    : 0

  const baseWhere = eq(sops.isPublished, 1)
  const where = keyword
    ? and(baseWhere, or(like(sops.judul, `%${keyword}%`), like(sops.deskripsi, `%${keyword}%`))!)
    : baseWhere

  let total = 0
  if (hasPagination) {
    const countRes = await useDb()
      .select({ cnt: sql<number>`count(*)` })
      .from(sops)
      .where(where)
    total = Number(countRes[0]?.cnt ?? 0)
  }

  const totalPages = hasPagination && limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1
  const safePage = hasPagination ? Math.min(page, totalPages) : 1
  const offset = hasPagination ? (safePage - 1) * limit : 0

  const rows = await useDb().query.sops.findMany({
    where,
    orderBy: [desc(sops.id)],
    ...(hasPagination ? { limit, offset } : {}),
  })

  if (!hasPagination) {
    const countRes = await useDb()
      .select({ cnt: sql<number>`count(*)` })
      .from(sops)
      .where(where)
    total = Number(countRes[0]?.cnt ?? rows.length)
  }

  if (hasPagination) {
    return { data: rows, meta: { total, page: safePage, limit, totalPages } }
  }
  return { data: rows, meta: { total, page: 1, limit: total, totalPages: 1 } }
})
