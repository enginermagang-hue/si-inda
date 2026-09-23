import { desc } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { sops } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/sops
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().query.sops.findMany({ orderBy: [desc(sops.id)] })
  return { data: rows }
})
