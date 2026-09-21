import { useDb } from '../../utils/db'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/settings
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().query.settings.findMany()
  return { data: rows }
})
