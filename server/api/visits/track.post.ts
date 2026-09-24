import { sql } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { visits } from '../../db/schema'

const BOT_RE = /bot|crawl|spider|slurp|mediapartners|baidu|yandex|sogou|exabot|facebot|ia_archiver/i
const COOKIE_NAME = 'siindah_vid'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 hari
const DEDUPE_MINUTES = 5

function genVisitorId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getClientIp(event: unknown): string | null {
  try {
    const ip = getRequestIP(event as Parameters<typeof getRequestIP>[0], { xForwardedFor: true })
    return ip || null
  } catch {
    return null
  }
}

function getCountry(event: unknown): string | null {
  const h = getHeader(event as Parameters<typeof getHeader>[0], 'cf-ipcountry') || getHeader(event as Parameters<typeof getHeader>[0], 'x-country') || getHeader(event as Parameters<typeof getHeader>[0], 'x-vercel-ip-country')
  if (h && typeof h === 'string' && h.length === 2) return h.toUpperCase()
  return null
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({})) as Record<string, unknown>
  const rawPath = typeof body.path === 'string' ? body.path : (getHeader(event, 'referer') || '/')
  const path = rawPath.trim().slice(0, 500) || '/'
  if (path.length > 500) return { ok: true }

  const ua = getHeader(event, 'user-agent') || ''
  if (BOT_RE.test(ua)) return { ok: true }

  let visitorId = getCookie(event, COOKIE_NAME)
  let isNewVisitor = false
  if (!visitorId) {
    visitorId = genVisitorId()
    isNewVisitor = true
    setCookie(event, COOKIE_NAME, visitorId, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })
  }

  const ip = getClientIp(event)
  const referer = (getHeader(event, 'referer') || (typeof body.referer === 'string' ? body.referer : null) || null)?.toString().slice(0, 500) || null
  const country = getCountry(event)

  const db = useDb()

  // dedupe: same visitorId + path within DEDUPE_MINUTES
  try {
    const dup = await db.select({ id: visits.id }).from(visits).where(sql`${visits.visitorId} = ${visitorId} AND ${visits.path} = ${path} AND ${visits.createdAt} > datetime('now', ${`-${DEDUPE_MINUTES} minutes`})`).limit(1)
    if (dup.length) return { ok: true, deduped: true }
    if (ip) {
      const ipDup = await db.select({ id: visits.id }).from(visits).where(sql`${visits.ip} = ${ip} AND ${visits.path} = ${path} AND ${visits.visitorId} != ${visitorId} AND ${visits.createdAt} > datetime('now', ${`-${DEDUPE_MINUTES} minutes`})`).limit(1)
      if (ipDup.length) return { ok: true, deduped: true }
    }
  } catch (_e) { void _e }

  await db.insert(visits).values({
    path,
    ip: ip || null,
    visitorId,
    userAgent: ua.slice(0, 500) || null,
    referer,
    country,
  })

  // upsert daily aggregation
  const today = new Date().toISOString().slice(0, 10)
  try {
    const cnt = await db.select({ c: sql<number>`count(*)` }).from(visits).where(sql`date(${visits.createdAt}) = ${today} AND ${visits.visitorId} = ${visitorId}`).then(r => r[0]?.c ?? 0)
    const uniqueInc = cnt === 1 ? 1 : 0
    await db.run(sql`INSERT INTO visit_daily(date, hits, uniques) VALUES(${today}, 1, ${uniqueInc}) ON CONFLICT(date) DO UPDATE SET hits = hits + 1, uniques = uniques + ${uniqueInc}`)
  } catch (_e) {
    void _e
    try {
      await db.run(sql`INSERT INTO visit_daily(date, hits, uniques) VALUES(${today}, 1, 0) ON CONFLICT(date) DO UPDATE SET hits = hits + 1`)
    } catch (_e2) { void _e2 }
  }

  return { ok: true, visitorId: isNewVisitor ? visitorId : undefined }
})
