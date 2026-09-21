import { desc } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { letters } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/letters
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().query.letters.findMany({ orderBy: [desc(letters.id)] })
  return { data: rows }
})
