import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { letters } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { deleteStoredFile, savePdfUpload } from '../../../../utils/storage'

// PUT /api/admin/letters/:id (multipart; file opsional = tidak diganti)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const current = await useDb().query.letters.findFirst({ where: eq(letters.id, id) })
  if (!current) throw createError({ statusCode: 404, message: 'Surat tidak ditemukan.' })
  const form = await readMultipartFormData(event)
  const get = (k: string): string | null => {
    const f = form?.find((x) => x.name === k)
    const v = f?.data.toString().trim() ?? ''
    return v ? v : null
  }
  const patch: Partial<typeof letters.$inferInsert> = {}
  const nomorSurat = get('nomor_surat')
  const judul = get('judul')
  const tanggalSurat = get('tanggal_surat')
  const deskripsiRaw = get('deskripsi')
  if (nomorSurat) patch.nomorSurat = nomorSurat
  if (judul) patch.judul = judul
  if (tanggalSurat) patch.tanggalSurat = tanggalSurat
  // deskripsi optional: if field present in form, update (empty string => null)
  const hasDeskripsi = form?.some((x) => x.name === 'deskripsi')
  if (hasDeskripsi) patch.deskripsi = deskripsiRaw ? deskripsiRaw.slice(0, 500) : null
  patch.isPublished = get('is_published') !== '0' ? 1 : 0
  const file = form?.find((x) => x.name === 'file' && x.filename)
  try {
    if (file?.data) {
      const stored = await savePdfUpload(
        { bytes: file.data, filename: file.filename ?? 'surat.pdf', type: file.type || 'application/pdf' },
      )
      patch.filePath = stored.url
      patch.dropboxPath = stored.path
      await deleteStoredFile(current.filePath, current.dropboxPath)
    }
  } catch (e) {
    throw createError({ statusCode: 400, message: e instanceof Error ? e.message : 'Upload gagal.' })
  }
  const rows = await useDb().update(letters).set(patch).where(eq(letters.id, id)).returning()
  return { data: rows[0] }
})
