import { eq } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { admins } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/me
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const row = await useDb().query.admins.findFirst({ where: eq(admins.id, admin.id) })
  return {
    data: { ...admin, mustChangePassword: row ? row.mustChangePassword === 1 : false },
  }
})
