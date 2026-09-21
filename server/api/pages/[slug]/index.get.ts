import { and, eq } from 'drizzle-orm'
import { useDb } from '../../../utils/db'
import { contentPages } from '../../../db/schema'

// GET /api/pages/:slug — isi satu halaman "Syarat ..."
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const row = await useDb().query.contentPages.findFirst({
    where: and(eq(contentPages.slug, slug), eq(contentPages.isPublished, 1)),
  })
  if (!row) throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan.' })
  return { data: row }
})
