import { desc, eq } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { complaints } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

// GET /api/admin/complaints[?status=baru]
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : undefined
  const rows = await useDb().query.complaints.findMany({
    where: status ? eq(complaints.status, status) : undefined,
    orderBy: [desc(complaints.id)],
  })
  return { data: rows }
})
