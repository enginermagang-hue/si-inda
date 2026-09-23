import { useDb } from '../../utils/db'
import { sops } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { saveImageUpload } from '../../utils/storage'

// POST /api/admin/sops (multipart: judul, deskripsi, is_published, file gambar)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const form = await readMultipartFormData(event)
  const get = (k: string): string | null => {
    const f = form?.find((x) => x.name === k)
    const v = f?.data.toString().trim() ?? ''
    return v ? v : null
  }
  const judul = get('judul')
  const deskripsi = get('deskripsi') ?? ''
  const isPublished = get('is_published') !== '0'
  if (!judul) {
    throw createError({ statusCode: 400, message: 'Judul SOP wajib diisi.' })
  }
  const file = form?.find((x) => x.name === 'file' && x.filename)
  if (!file?.data) throw createError({ statusCode: 400, message: 'Gambar SOP wajib diunggah.' })
  let stored
  try {
    stored = await saveImageUpload(
      { bytes: file.data, filename: file.filename ?? 'sop.png', type: file.type || 'image/png' },
      'sop',
      'SOP',
    )
  } catch (e) {
    throw createError({ statusCode: 400, message: e instanceof Error ? e.message : 'Upload gagal.' })
  }
  const now = new Date().toISOString()
  const [row] = await useDb()
    .insert(sops)
    .values({ judul, deskripsi, filePath: stored.url, dropboxPath: stored.path, isPublished: isPublished ? 1 : 0, createdAt: now, updatedAt: now })
    .returning()
  return { data: row }
})
