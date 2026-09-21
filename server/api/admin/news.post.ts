import { useDb } from '../../utils/db'
import { breakingNews } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { clean, readJsonBody, toInt01 } from '../../utils/validate'

// POST /api/admin/news
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const b = await readJsonBody(event)
  const title = clean(b?.title, 300)
  if (!title) throw createError({ statusCode: 400, message: 'title wajib diisi.' })
  const [row] = await useDb()
    .insert(breakingNews)
    .values({
      title,
      body: typeof b?.body === 'string' ? b.body.slice(0, 5000) : null,
      isActive: toInt01(b?.isActive ?? 1),
      expiresAt: typeof b?.expiresAt === 'string' && b.expiresAt.trim() ? b.expiresAt.trim() : null,
    })
    .returning()
  return { data: row }
})
