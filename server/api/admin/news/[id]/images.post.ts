import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { breakingNewsImages, breakingNews } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { saveImageUpload } from '../../../../utils/storage'
import { clean } from '../../../../utils/validate'

// POST /api/admin/news/:id/images (multipart: images, descriptions JSON array)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))

  const newsCheck = await useDb().query.breakingNews.findFirst({ where: eq(breakingNews.id, id) })
  if (!newsCheck) throw createError({ statusCode: 404, message: 'Berita tidak ditemukan.' })

  const form = await readMultipartFormData(event)
  const descriptionsRaw = form?.find((x) => x.name === 'descriptions')?.data.toString() ?? '[]'
  let descriptions: string[]
  try {
    const parsed = JSON.parse(descriptionsRaw)
    descriptions = Array.isArray(parsed) ? parsed : []
  } catch {
    descriptions = []
  }

  const files = (form ?? []).filter((x) => x.name === 'images' && x.filename && x.data)

  const imageRows = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file) continue
    const desc = typeof descriptions[i] === 'string' ? clean(descriptions[i], 500) : null
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

    const [row] = await useDb()
      .insert(breakingNewsImages)
      .values({
        newsId: id,
        filePath: stored.url,
        dropboxPath: stored.path,
        description: desc,
        sortOrder: i,
      })
      .returning()
    imageRows.push(row)
  }

  return { data: imageRows }
})
