import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { sops } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { deleteStoredFile, saveImageUpload } from '../../../../utils/storage'

// PUT /api/admin/sops/:id (multipart; file opsional = tidak diganti)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const current = await useDb().query.sops.findFirst({ where: eq(sops.id, id) })
  if (!current) throw createError({ statusCode: 404, message: 'SOP tidak ditemukan.' })
  const form = await readMultipartFormData(event)
  const get = (k: string): string | null => {
    const f = form?.find((x) => x.name === k)
    const v = f?.data.toString().trim() ?? ''
    return v ? v : null
  }
  const patch: Partial<typeof sops.$inferInsert> = {}
  const judul = get('judul')
  const deskripsi = get('deskripsi')
  if (judul) patch.judul = judul
  if (deskripsi !== null) patch.deskripsi = deskripsi
  patch.isPublished = get('is_published') !== '0' ? 1 : 0
  patch.updatedAt = new Date().toISOString()
  const file = form?.find((x) => x.name === 'file' && x.filename)
  try {
    if (file?.data) {
      const stored = await saveImageUpload(
        { bytes: file.data, filename: file.filename ?? 'sop.png', type: file.type || 'image/png' },
        'sop',
        'SOP',
      )
      patch.filePath = stored.url
      patch.dropboxPath = stored.path
      await deleteStoredFile(current.filePath, current.dropboxPath)
    }
  } catch (e) {
    throw createError({ statusCode: 400, message: e instanceof Error ? e.message : 'Upload gagal.' })
  }
  const rows = await useDb().update(sops).set(patch).where(eq(sops.id, id)).returning()
  return { data: rows[0] }
})
