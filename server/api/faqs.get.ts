import { and, asc, eq, like, or } from 'drizzle-orm'
import { useDb } from '../utils/db'
import { faqs } from '../db/schema'

// GET /api/faqs?q=&category=
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const keyword = typeof q.q === 'string' ? q.q.trim().slice(0, 100) : ''
  const category = typeof q.category === 'string' ? q.category.trim().slice(0, 100) : ''

  const conds = [eq(faqs.isPublished, 1)]
  if (category) conds.push(eq(faqs.category, category))
  if (keyword) {
    const pat = `%${keyword}%`
    conds.push(or(like(faqs.question, pat), like(faqs.answer, pat), like(faqs.category, pat))!)
  }
  const rows = await useDb().query.faqs.findMany({
    where: and(...conds),
    orderBy: [asc(faqs.sortOrder), asc(faqs.id)],
  })
  return { data: rows }
})
