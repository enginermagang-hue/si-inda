import * as jose from 'jose'
import { eq } from 'drizzle-orm'
import { useDb } from './db'
import { admins } from '../db/schema'
import type { ServerEvent } from './validate'

// Catatan: helper cookie/createError/defineEventHandler di-auto-import oleh
// Nitro (h3 v1) — jangan import dari 'h3' (root memakai h3 v2 yang inkompatibel).

export const COOKIE_NAME = 'siindah_admin'
const SESSION_HOURS = 12

export interface AdminSession {
  id: number
  name: string
  username: string
}

function jwtSecret(): Uint8Array {
  const config = useRuntimeConfig()
  const secret = (config.jwtSecret as string)?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('NUXT_JWT_SECRET wajib diisi (minimal 32 karakter). Lihat .env.example')
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(adminId: number, username: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new jose.SignJWT({ sub: String(adminId), username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_HOURS * 3600)
    .sign(jwtSecret())
}

export function setSessionCookie(event: ServerEvent, token: string): void {
  const secure = process.env.NODE_ENV === 'production'
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  })
}

export function clearSessionCookie(event: ServerEvent): void {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

/** Ambil admin dari cookie sesi. Throw 401 bila tidak valid. */
export async function requireAdmin(event: ServerEvent): Promise<AdminSession> {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) throw createError({ statusCode: 401, message: 'Belum login.' })
  try {
    const { payload } = await jose.jwtVerify(token, jwtSecret())
    const adminId = Number(payload.sub)
    if (!Number.isInteger(adminId)) throw new Error('sub invalid')
    const admin = await useDb().query.admins.findFirst({ where: eq(admins.id, adminId) })
    if (!admin) throw new Error('admin hilang')
    return { id: admin.id, name: admin.name, username: admin.username }
  } catch {
    throw createError({ statusCode: 401, message: 'Sesi kedaluwarsa, silakan login ulang.' })
  }
}
