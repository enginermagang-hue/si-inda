import { saveImageUpload } from '../../../utils/storage'
import { requireAdmin } from '../../../utils/auth'

// POST /api/admin/uploads/image (multipart: file)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const form = await readMultipartFormData(event)
  const file = form?.find((x) => x.name === 'file' && x.filename)
  if (!file?.data) throw createError({ statusCode: 400, message: 'File gambar wajib diunggah.' })
  let stored
  try {
    stored = await saveImageUpload({
      bytes: file.data,
      filename: file.filename ?? 'gambar.png',
      type: file.type || 'application/octet-stream',
    })
  } catch (e) {
    throw createError({ statusCode: 400, message: e instanceof Error ? e.message : 'Upload gambar gagal.' })
  }
  return { data: { url: stored.url } }
})
