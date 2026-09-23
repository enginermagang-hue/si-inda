import { useDb } from '../utils/db'

// GET /api/settings/public — hanya key yang aman untuk publik
const PUBLIC_SETTINGS = ['site_name', 'site_tagline', 'contact_wa', 'footer_text']

export default defineEventHandler(async () => {
  const rows: Array<{ key: string; value: string }> = await useDb().query.settings.findMany()
  const out: Record<string, string> = {}
  for (const r of rows) if (PUBLIC_SETTINGS.includes(r.key)) out[r.key] = r.value
  return { data: out }
})
