import { desc, eq } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { letters } from '../db/schema'

// GET /api/letters — surat yang dipublish (terbaru dulu)
export default defineEventHandler(async () => {
  const rows = await useDb().query.letters.findMany({
    where: eq(letters.isPublished, 1),
    orderBy: [desc(letters.tanggalSurat), desc(letters.id)],
  })
  return { data: rows }
})
