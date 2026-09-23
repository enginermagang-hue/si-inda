import { desc, eq } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { sops } from '../db/schema'

// GET /api/sops — SOP yang dipublish (terbaru dulu)
export default defineEventHandler(async () => {
  const rows = await useDb().query.sops.findMany({
    where: eq(sops.isPublished, 1),
    orderBy: [desc(sops.id)],
  })
  return { data: rows }
})
