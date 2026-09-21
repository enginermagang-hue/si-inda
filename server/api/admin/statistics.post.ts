import { eq } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { statistics } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { clean, readJsonBody, STAT_CATEGORIES, toInt01 } from '../../utils/validate'

// POST /api/admin/statistics
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const b = await readJsonBody(event)
  if (!b || !STAT_CATEGORIES.includes(b.category as (typeof STAT_CATEGORIES)[number])) {
    throw createError({ statusCode: 400, message: `category harus salah satu: ${STAT_CATEGORIES.join(', ')}` })
  }
  const label = clean(b.label, 200)
  const period = clean(b.period, 50)
  const value = Number(b.value)
  if (!label || !period) throw createError({ statusCode: 400, message: 'label dan period wajib diisi.' })
  if (!Number.isInteger(value) || value < 0) {
    throw createError({ statusCode: 400, message: 'value harus bilangan bulat ≥ 0.' })
  }
  const jenjang = typeof b.jenjang === 'string' && b.jenjang.trim() ? b.jenjang.trim().slice(0, 50) : null
  const isCurrent = toInt01(b.isCurrent)
  if (isCurrent) {
    await useDb().update(statistics).set({ isCurrent: 0 }).where(eq(statistics.category, b.category as string))
  }
  const [row] = await useDb()
    .insert(statistics)
    .values({ category: b.category as string, jenjang, label, value, period, isCurrent })
    .returning()
  return { data: row }
})
