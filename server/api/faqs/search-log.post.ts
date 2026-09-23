import { useDb } from '../../utils/db'
import { faqSearchLogs } from '../../db/schema'
import { clean, readJsonBody } from '../../utils/validate'

// POST /api/faqs/search-log { keyword, faqId? }
export default defineEventHandler(async (event) => {
  const b = await readJsonBody(event)
  const keyword = clean(b?.keyword, 100)?.toLowerCase() ?? null
  if (!keyword || keyword.length < 2) return { ok: true }
  const faqId = Number.isInteger(Number(b?.faqId)) ? Number(b?.faqId) : null
  await useDb().insert(faqSearchLogs).values({ keyword, faqId })
  return { ok: true }
})
