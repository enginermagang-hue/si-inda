import { asc, eq } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { infoLinks } from '../db/schema'

// GET /api/links — link informasi
export default defineEventHandler(async () => {
  const rows = await useDb().query.infoLinks.findMany({
    where: eq(infoLinks.isPublished, 1),
    orderBy: [asc(infoLinks.sortOrder), asc(infoLinks.id)],
  })
  return { data: rows }
})
