import { useDb } from '../../utils/db'
import { letters } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { savePdfUpload } from '../../utils/storage'

// POST /api/admin/letters (multipart: nomor_surat, judul, tanggal_surat, is_published, file)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const form = await readMultipartFormData(event)
  const get = (k: string): string | null => {
    const f = form?.find((x) => x.name === k)
    const v = f?.data.toString().trim() ?? ''
    return v ? v : null
  }
  const nomorSurat = get('nomor_surat')
  const judul = get('judul')
  const tanggalSurat = get('tanggal_surat')
  const deskripsiRaw = get('deskripsi')
  const deskripsi = deskripsiRaw ? deskripsiRaw.slice(0, 500) : null
  const isPublished = get('is_published') !== '0'
  if (!nomorSurat || !judul || !tanggalSurat) {
    throw createError({ statusCode: 400, message: 'nomor_surat, judul, dan tanggal_surat wajib diisi.' })
  }
  const file = form?.find((x) => x.name === 'file' && x.filename)
  if (!file?.data) throw createError({ statusCode: 400, message: 'Lampiran PDF wajib untuk surat baru.' })
  let stored
  try {
    stored = await savePdfUpload(
      { bytes: file.data, filename: file.filename ?? 'surat.pdf', type: file.type || 'application/pdf' },
    )
  } catch (e) {
    throw createError({ statusCode: 400, message: e instanceof Error ? e.message : 'Upload gagal.' })
  }
  const [row] = await useDb()
    .insert(letters)
    .values({ nomorSurat, judul, tanggalSurat, deskripsi, filePath: stored.url, dropboxPath: stored.path, isPublished: isPublished ? 1 : 0 })
    .returning()
  return { data: row }
})
