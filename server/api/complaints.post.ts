import { useDb } from '../utils/db'
import { complaints } from '../db/schema'
import { savePdfUpload } from '../utils/storage'

// POST /api/complaints — form pengaduan publik (tanpa akun).
// Menerima multipart/form-data: nama, kontak, sekolah, kategori, isi, file (opsional, PDF).
export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, message: 'Body harus multipart/form-data.' })
  const get = (k: string): string | null => {
    const f = form.find((x) => x.name === k)
    const v = f?.data.toString().trim() ?? ''
    return v ? v : null
  }
  const nama = get('nama')
  const kontak = get('kontak')
  const sekolah = get('sekolah')
  const isiRaw = get('isi')
  const kategori = get('kategori') ?? 'Lainnya'
  if (!nama) throw createError({ statusCode: 400, message: 'Nama wajib diisi (maks 100 karakter).' })
  if (!kontak) throw createError({ statusCode: 400, message: 'Kontak (WA/email) wajib diisi.' })
  if (!sekolah) throw createError({ statusCode: 400, message: 'Nama Sekolah wajib diisi (maks 100 karakter).' })
  if (!isiRaw || isiRaw.length < 10) {
    throw createError({ statusCode: 400, message: 'Isi kendala minimal 10 karakter.' })
  }
  const file = form.find((x) => x.name === 'file' && x.filename)
  let filePath: string | null = null
  let dropboxPath: string | null = null
  if (file?.data) {
    try {
      const stored = await savePdfUpload(
        { bytes: file.data, filename: file.filename ?? 'pengaduan.pdf', type: file.type || 'application/pdf' },
        'pengaduan',
        'PENGADUAN',
      )
      filePath = stored.url
      dropboxPath = stored.path
    } catch (e) {
      throw createError({ statusCode: 400, message: e instanceof Error ? e.message : 'Upload lampiran gagal.' })
    }
  }
  const [row] = await useDb()
    .insert(complaints)
    .values({
      nama,
      kontak,
      sekolah,
      kategori: kategori.slice(0, 50),
      isi: isiRaw,
      filePath,
      dropboxPath,
      status: 'baru',
    })
    .returning({ id: complaints.id })
  return { message: 'Pengaduan terkirim. Nomor tiket Anda:', ticket: row?.id }
})
