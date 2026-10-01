import { eq } from 'drizzle-orm'
import { useDb } from '../../../utils/db'
import { faqSearchLogs } from '../../../db/schema'
import { requireAdmin } from '../../../utils/auth'

// DELETE /api/admin/faqs/search-logs?keyword=foo  — hapus log kata kunci tertentu
// DELETE /api/admin/faqs/search-logs?all=1        — hapus seluruh log pencarian FAQ
// Catatan: keyword sudah dinormalisasi ke lowercase saat insert, jadi eq() aman.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = getQuery(event)
  const db = useDb()
  if (q.all === '1' || q.all === 'true') {
    await db.delete(faqSearchLogs)
    return { ok: true, deleted: 'all' }
  }
  const keyword = typeof q.keyword === 'string' ? q.keyword.trim().toLowerCase() : ''
  if (!keyword) throw createError({ statusCode: 400, message: 'Parameter keyword diperlukan.' })
  await db.delete(faqSearchLogs).where(eq(faqSearchLogs.keyword, keyword))
  return { ok: true }
})
