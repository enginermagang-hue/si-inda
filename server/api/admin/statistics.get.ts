import { readStatistics } from '../../utils/statistics'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/statistics - Return full statistics data for admin edit
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const data = readStatistics()
  return { data }
})
