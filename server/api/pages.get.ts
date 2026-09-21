import { and, asc, eq } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { contentPages } from '../db/schema'

// GET /api/pages?group=ptk — daftar halaman per grup menu (tanpa body)
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const group = typeof query.group === 'string' ? query.group : undefined
  const rows = await useDb().query.contentPages.findMany({
    where: group
      ? and(eq(contentPages.isPublished, 1), eq(contentPages.menuGroup, group))
      : eq(contentPages.isPublished, 1),
    orderBy: [asc(contentPages.sortOrder), asc(contentPages.id)],
    columns: { body: false },
  })
  return { data: rows }
})
