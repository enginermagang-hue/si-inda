import { useDb } from '../../utils/db'
import { faqs } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { clean, readJsonBody, toInt01 } from '../../utils/validate'

// POST /api/admin/faqs
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const b = await readJsonBody(event)
  const question = clean(b?.question, 500)
  if (!question) throw createError({ statusCode: 400, message: 'Pertanyaan wajib diisi.' })
  const answer = typeof b?.answer === 'string' ? b.answer.slice(0, 20000) : ''
  const category = clean(b?.category, 100) ?? 'Umum'
  const [row] = await useDb()
    .insert(faqs)
    .values({
      question,
      answer,
      category,
      sortOrder: Number.isInteger(Number(b?.sortOrder)) ? Number(b?.sortOrder) : 0,
      isPublished: toInt01(b?.isPublished ?? 1),
    })
    .returning()
  return { data: row }
})
