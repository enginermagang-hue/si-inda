import { useDb } from '../../utils/db'
import { settings } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { readJsonBody } from '../../utils/validate'

const EDITABLE_SETTINGS = ['site_name', 'site_tagline', 'sop_drive_url', 'contact_wa', 'footer_text']

// PUT /api/admin/settings
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const b = await readJsonBody(event)
  if (!b) throw createError({ statusCode: 400, message: 'Body harus JSON object.' })
  for (const [key, value] of Object.entries(b)) {
    if (!EDITABLE_SETTINGS.includes(key)) continue
    const v = typeof value === 'string' ? value.slice(0, 2000) : ''
    if (key === 'sop_drive_url' && v && !/^https?:\/\//i.test(v)) {
      throw createError({ statusCode: 400, message: 'sop_drive_url harus URL http(s):// atau dikosongkan.' })
    }
    await useDb().insert(settings).values({ key, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } })
  }
  const rows = await useDb().query.settings.findMany()
  return { data: rows }
})
