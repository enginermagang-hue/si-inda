import { useDb } from '../../utils/db'
import { infoLinks } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { clean, readJsonBody, toInt01 } from '../../utils/validate'

// POST /api/admin/links
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const b = await readJsonBody(event)
  const title = clean(b?.title, 200)
  const url = clean(b?.url, 2000)
  if (!title || !url || !/^https?:\/\//i.test(url)) {
    throw createError({ statusCode: 400, message: 'title dan url (http(s)://...) wajib diisi.' })
  }
  const [row] = await useDb()
    .insert(infoLinks)
    .values({
      title,
      url,
      sortOrder: Number.isInteger(Number(b?.sortOrder)) ? Number(b?.sortOrder) : 0,
      isPublished: toInt01(b?.isPublished ?? 1),
    })
    .returning()
  return { data: row }
})
