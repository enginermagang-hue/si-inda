import { eq } from 'drizzle-orm'
import { useDb } from '../../../../../utils/db'
import { breakingNewsImages } from '../../../../../db/schema'
import { requireAdmin } from '../../../../../utils/auth'
import { deleteStoredFile } from '../../../../../utils/storage'

// DELETE /api/admin/news/:id/images/:imageId
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

  await deleteStoredFile(current.filePath, current.dropboxPath)
  await useDb().delete(breakingNewsImages).where(eq(breakingNewsImages.id, imageId))
  return { message: 'Gambar dihapus.' }
})
