import { useDb } from '../utils/db'
import { complaints } from '../db/schema'
import { readJsonBody } from '../utils/validate'

// POST /api/complaints — form pengaduan publik (tanpa akun)
export default defineEventHandler(async (event) => {
  const b = await readJsonBody(event)
  if (!b) throw createError({ statusCode: 400, message: 'Body harus JSON object.' })
  const str = (v: unknown, max: number): string | null => {
    if (typeof v !== 'string') return null
    const t = v.trim()
    return t && t.length >= 1 && t.length <= max ? t : null
  }
  const nama = str(b.nama, 100)
  const kontak = str(b.kontak, 100)
  const isiRaw = str(b.isi, 2000)
  const kategori =
    typeof b.kategori === 'string' && b.kategori.trim() ? b.kategori.trim().slice(0, 50) : 'Lainnya'
  if (!nama) throw createError({ statusCode: 400, message: 'Nama wajib diisi (maks 100 karakter).' })
  if (!kontak) throw createError({ statusCode: 400, message: 'Kontak (WA/email) wajib diisi.' })
  if (!isiRaw || isiRaw.length < 10) {
    throw createError({ statusCode: 400, message: 'Isi kendala minimal 10 karakter.' })
  }
  const [row] = await useDb()
    .insert(complaints)
    .values({ nama, kontak, kategori, isi: isiRaw, status: 'baru' })
    .returning({ id: complaints.id })
  return { message: 'Pengaduan terkirim. Nomor tiket Anda:', ticket: row?.id }
})
