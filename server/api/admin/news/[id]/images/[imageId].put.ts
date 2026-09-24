import { eq } from 'drizzle-orm'
import { useDb } from '../../../../../utils/db'
import { breakingNewsImages } from '../../../../../db/schema'
import { requireAdmin } from '../../../../../utils/auth'
import { saveImageUpload, deleteStoredFile } from '../../../../../utils/storage'
import { clean, readJsonBody } from '../../../../../utils/validate'

// PUT /api/admin/news/:id/images/:imageId (update description, optional multipart file replace)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const imageId = Number(getRouterParam(event, 'imageId'))

  const current = await useDb().query.breakingNewsImages.findFirst({
    where: eq(breakingNewsImages.id, imageId),
  })
  if (!current || current.newsId !== id) {
    throw createError({ statusCode: 404, message: 'Gambar tidak ditemukan.' })
  }

  const form = await readMultipartFormData(event)
  const b = await readJsonBody(event)

  const patch: Partial<typeof breakingNewsImages.$inferInsert> = {}

  if (b?.description !== undefined) {
    patch.description = typeof b.description === 'string' ? clean(b.description, 500) ?? null : null
  }

  const file = form?.find((x) => x.name === 'file' && x.filename && x.data)
  if (file?.data) {
    let stored
    try {
      stored = await saveImageUpload(
        { bytes: file.data, filename: file.filename ?? 'news.png', type: file.type || 'image/png' },
        'news',
        'GAMBAR',
      )
    } catch (e) {
      throw createError({ statusCode: 400, message: e instanceof Error ? e.message : 'Upload gambar gagal.' })
    }
    patch.filePath = stored.url
    patch.dropboxPath = stored.path
    if (current.filePath || current.dropboxPath) {
      await deleteStoredFile(current.filePath, current.dropboxPath)
    }
  }

  if (Object.keys(patch).length === 0) throw createError({ statusCode: 400, message: 'Tidak ada perubahan.' })

  const [row] = await useDb().update(breakingNewsImages).set(patch).where(eq(breakingNewsImages.id, imageId)).returning()
  return { data: row }
})
