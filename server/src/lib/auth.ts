import type { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import { db } from '../db/client.js'
import { admins } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export const COOKIE_NAME = 'siindah_admin'
const SESSION_HOURS = 12
const JWT_ALG = 'HS256'

export interface AdminSession {
  id: number
  name: string
  username: string
}

export type AppEnv = { Variables: { admin: AdminSession } }

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET wajib diisi (minimal 32 karakter). Lihat server/.env.example')
  }
  return secret
}

export async function createSessionToken(adminId: number, username: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return sign(
    { sub: adminId, username, iat: now, exp: now + SESSION_HOURS * 3600 },
    jwtSecret(),
    JWT_ALG,
  )
}

export function setSessionCookie(c: Context, token: string): void {
  const secure = process.env.NODE_ENV === 'production'
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure,
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  })
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
}

/** Middleware: hanya admin login yang boleh lewat. Menyimpan admin di c.get('admin'). */
export async function adminAuth(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const token = getCookie(c, COOKIE_NAME)
  if (!token) return c.json({ error: 'Belum login.' }, 401)
  try {
    const payload = await verify(token, jwtSecret(), JWT_ALG)
    const adminId = Number(payload.sub)
    if (!Number.isInteger(adminId)) return c.json({ error: 'Sesi tidak valid.' }, 401)
    const admin = await db.query.admins.findFirst({ where: eq(admins.id, adminId) })
    if (!admin) return c.json({ error: 'Sesi tidak valid.' }, 401)
    c.set('admin', { id: admin.id, name: admin.name, username: admin.username })
    await next()
  } catch {
    return c.json({ error: 'Sesi kedaluwarsa, silakan login ulang.' }, 401)
  }
}
