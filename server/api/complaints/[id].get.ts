import { eq } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { complaints } from '../../db/schema'

// GET /api/complaints/:id — lacak status publik (tanpa auth).
// Hanya mengembalikan kolom non-sensitif: id, kategori, status, adminNote, createdAt, updatedAt.
export default defineEventHandler(async (event) => {
  const rawId = getRouterParam(event, 'id')
  const id = Number(rawId)
  if (!rawId || !Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Nomor tiket tidak valid.' })
  }
  const row = await useDb().query.complaints.findFirst({
    where: eq(complaints.id, id),
    columns: { id: true, kategori: true, status: true, adminNote: true, createdAt: true, updatedAt: true },
  })
  if (!row) throw createError({ statusCode: 404, message: 'Pengaduan tidak ditemukan.' })
  return { data: row }
})
