import { eq } from 'drizzle-orm'
import { useDb } from '../../../../utils/db'
import { statistics } from '../../../../db/schema'
import { requireAdmin } from '../../../../utils/auth'
import { clean, readJsonBody, toInt01 } from '../../../../utils/validate'

// PUT /api/admin/statistics/:id
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const b = await readJsonBody(event)
  if (!b) throw createError({ statusCode: 400, message: 'Body harus JSON object.' })
  const patch: Partial<typeof statistics.$inferInsert> = { updatedAt: new Date().toISOString() }
  if (b.label !== undefined) {
    const label = clean(b.label, 200)
    if (!label) throw createError({ statusCode: 400, message: 'label tidak valid.' })
    patch.label = label
  }
  if (b.period !== undefined) {
    const period = clean(b.period, 50)
    if (!period) throw createError({ statusCode: 400, message: 'period tidak valid.' })
    patch.period = period
  }
  if (b.value !== undefined) {
    const value = Number(b.value)
    if (!Number.isInteger(value) || value < 0) {
      throw createError({ statusCode: 400, message: 'value harus bilangan bulat ≥ 0.' })
    }
    patch.value = value
  }
  if (b.jenjang !== undefined) {
    patch.jenjang = typeof b.jenjang === 'string' && b.jenjang.trim() ? b.jenjang.trim().slice(0, 50) : null
  }
  if (b.isCurrent !== undefined) {
    patch.isCurrent = toInt01(b.isCurrent)
    if (patch.isCurrent) {
      const current = await useDb().query.statistics.findFirst({ where: eq(statistics.id, id) })
      if (current) {
        await useDb().update(statistics).set({ isCurrent: 0 }).where(eq(statistics.category, current.category))
      }
    }
  }
  const rows = await useDb().update(statistics).set(patch).where(eq(statistics.id, id)).returning()
  if (!rows.length) throw createError({ statusCode: 404, message: 'Data tidak ditemukan.' })
  return { data: rows[0] }
})
