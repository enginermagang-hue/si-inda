import { eq } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { contentPages } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { clean, MENU_GROUPS, readJsonBody, toInt01 } from '../../utils/validate'

// POST /api/admin/pages
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const b = await readJsonBody(event)
  const slug = clean(b?.slug, 100)?.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const title = clean(b?.title, 200)
  if (!slug || !title) throw createError({ statusCode: 400, message: 'slug dan title wajib diisi.' })
  if (!MENU_GROUPS.includes(b?.menuGroup as (typeof MENU_GROUPS)[number])) {
    throw createError({ statusCode: 400, message: `menuGroup harus salah satu: ${MENU_GROUPS.join(', ')}` })
  }
  const exists = await useDb().query.contentPages.findFirst({ where: eq(contentPages.slug, slug) })
  if (exists) throw createError({ statusCode: 409, message: 'slug sudah dipakai.' })
  const [row] = await useDb()
    .insert(contentPages)
    .values({
      slug,
      menuGroup: b?.menuGroup as string,
      title,
      body: typeof b?.body === 'string' ? (b.body as string).slice(0, 100000) : '',
      isPublished: toInt01(b?.isPublished ?? 1),
      sortOrder: Number.isInteger(Number(b?.sortOrder)) ? Number(b?.sortOrder) : 0,
    })
    .returning()
  return { data: row }
})
