import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Driver penyimpanan file PDF.
 * - 'local'   : public/uploads (development, diserve otomatis).
 * - 'dropbox' : Dropbox API (production — disk serverless tidak permanen).
 * Modul ini terisolasi: ganti driver cukup via env NUXT_STORAGE_DRIVER.
 *
 * Path Dropbox selalu relatif ke root namespace aplikasi. Untuk aplikasi
 * bertipe App folder, root tersebut adalah App Folder-nya sendiri
 * (mis. `si-inda`), sehingga folder kategori cukup ditulis tanpa awalan
 * nama app: `surat`, `sop`, dst.
 */

export function storageDriver(): 'local' | 'dropbox' {
  const config = useRuntimeConfig()
  return norm(config.storageDriver as string) === 'dropbox' ? 'dropbox' : 'local'
}

/** Folder kategori di Dropbox (relatif ke root namespace aplikasi). */
export const DROPBOX_FOLDERS = {
  SURAT: 'surat',
  SOP: 'sop',
} as const

export type DropboxFolderKey = keyof typeof DROPBOX_FOLDERS

export const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB

export interface StoredFile {
  /** URL publik untuk diunduh (path relatif lokal atau URL Dropbox). */
  url: string
  /** Path internal untuk hapus (path Dropbox atau path relatif lokal). NULL bila tak ada. */
  path: string | null
}

export interface PdfInput {
  bytes: Uint8Array
  filename: string
  type: string
}

/** Normalisasi value env: buang whitespace + tanda kutip pembungkus. */
export function norm(v?: string): string {
  if (!v) return ''
  return v.trim().replace(/^["']|["']$/g, '')
}

function assertPdf(size: number, type: string): void {
  if (type !== 'application/pdf') throw createError({ statusCode: 400, message: 'File harus berformat PDF.' })
  if (size > MAX_PDF_BYTES) throw createError({ statusCode: 400, message: 'Ukuran PDF maksimal 10 MB.' })
}

/* ---------- Driver lokal ---------- */

export function ensureUploadDir(): void {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

async function saveLocal(input: PdfInput, prefix: string): Promise<StoredFile> {
  assertPdf(input.bytes.length, input.type)
  const ext = extname(input.filename).toLowerCase() || '.pdf'
  const stored = `${prefix}-${randomUUID()}${ext}`
  ensureUploadDir()
  writeFileSync(join(UPLOAD_DIR, stored), new Uint8Array(input.bytes))
  return { url: `uploads/${stored}`, path: `uploads/${stored}` }
}

function deleteLocal(relativePath: string | null | undefined): void {
  if (!relativePath) return
  const safe = relativePath.replace(/^uploads\//, '').replace(/[/\\]/g, '')
  if (!safe) return
  const full = join(UPLOAD_DIR, safe)
  if (existsSync(full)) unlinkSync(full)
}

/* ---------- Driver Dropbox ---------- */

const TOKEN_ENDPOINT = 'https://api.dropboxapi.com/oauth2/token'
const TOKEN_EXPIRY_BUFFER_MS = 60_000

function dropboxEnv(): {
  appKey: string
  appSecret: string
  refreshToken: string
  staticToken: string
  base: string
} {
  const config = useRuntimeConfig()
  const appKey = norm(config.dropboxAppKey as string)
  const appSecret = norm(config.dropboxAppSecret as string)
  const refreshToken = norm(config.dropboxRefreshToken as string)
  const staticToken = norm(config.dropboxToken as string)
  const base = norm(config.dropboxBase as string).replace(/^\/+|\/+$/g, '')
  if (!appKey || !appSecret || !refreshToken) {
    if (!staticToken) {
      throw createError({
        statusCode: 500,
        message: 'NUXT_DROPBOX_APP_KEY / _APP_SECRET / _REFRESH_TOKEN wajib diisi untuk driver dropbox.',
      })
    }
  }
  return { appKey, appSecret, refreshToken, staticToken, base }
}

let cachedToken: { token: string; expiresAt: number } | null = null
let refreshing: Promise<string> | null = null

export async function dropboxAccessToken(): Promise<string> {
  const { appKey, appSecret, refreshToken, staticToken } = dropboxEnv()

  if (!refreshToken) {
    if (!staticToken) throw createError({ statusCode: 500, message: 'Dropbox token belum dikonfigurasi.' })
    return staticToken
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS) {
    return cachedToken.token
  }

  if (refreshing) return refreshing

  if (!appKey || !appSecret) {
    if (staticToken) {
      console.warn('[Dropbox] app key/secret belum dikonfigurasi, fallback ke static token')
      return staticToken
    }
    throw createError({ statusCode: 500, message: 'Dropbox app key/secret belum dikonfigurasi (untuk refresh token).' })
  }

  refreshing = (async () => {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    })
    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[Dropbox] refresh token gagal', { status: res.status, body: text.slice(0, 300) })
      if (staticToken) {
        console.warn('[Dropbox] fallback ke static token')
        return staticToken
      }
      throw createError({ statusCode: 502, message: `Gagal refresh token Dropbox (${res.status}): ${text.slice(0, 200)}` })
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!json.access_token) throw createError({ statusCode: 502, message: 'Respons token Dropbox tidak valid.' })
    cachedToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in || 14400) * 1000 }
    return cachedToken.token
  })().finally(() => {
    refreshing = null
  })

  return refreshing
}

function extractDropboxTag(bodyText: string): string {
  try {
    const obj = JSON.parse(bodyText) as Record<string, unknown>
    const err = obj?.error as Record<string, unknown> | undefined
    const candidates: string[] = []
    const tag = err?.['.tag']
    if (typeof tag === 'string') candidates.push(tag)
    const pathTag = (err?.path as Record<string, unknown> | undefined)?.['.tag']
    if (typeof pathTag === 'string') candidates.push(pathTag)
    if (typeof obj?.error_summary === 'string') {
      candidates.push(obj.error_summary.split('/')[0] as string)
    }
    return [...new Set(candidates)].join('|')
  } catch {
    return ''
  }
}

export function mapDropboxError(status: number, tag: string, scopeFor: 'read' | 'write', summary: string) {
  const tokenErrs = ['expired_access_token', 'invalid_access_token', 'invalid_token', 'token_expired', 'expired']
  const scopeErrs = ['no_permission', 'missing_scope', 'insufficient_permissions', 'not_allowed']
  const notFoundErrs = ['not_found', 'path/not_found']

  if (status === 401 || tokenErrs.some((t) => tag.includes(t))) {
    return { statusCode: 401, statusMessage: 'Token Dropbox tidak valid atau kedaluwarsa. Perbarui token di konfigurasi.' }
  }
  if (status === 403 || scopeErrs.some((t) => tag.includes(t))) {
    return {
      statusCode: 403,
      statusMessage:
        scopeFor === 'read'
          ? 'Token Dropbox tidak memiliki izin baca file (scope files.content.read).'
          : 'Token Dropbox tidak memiliki izin tulis file (scope files.content.write).',
    }
  }
  if (status === 404 || notFoundErrs.some((t) => tag.includes(t))) {
    return { statusCode: 404, statusMessage: 'File tidak ditemukan di Dropbox.' }
  }
  if (status === 429 || tag.includes('rate_limit') || tag.includes('too_many')) {
    return { statusCode: 429, statusMessage: 'Terlalu banyak permintaan ke Dropbox, coba lagi nanti.' }
  }
  return { statusCode: 502, statusMessage: `Dropbox error (${status}): ${summary || tag || 'unknown'}` }
}

async function dropboxRpc(endpoint: string, body: unknown, scopeFor: 'read' | 'write' = 'write'): Promise<unknown> {
  const token = await dropboxAccessToken()
  const res = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const tag = extractDropboxTag(text)
    console.error(`[Dropbox] ${endpoint} gagal`, { status: res.status, tag, body: text.slice(0, 300) })
    throw createError(mapDropboxError(res.status, tag, scopeFor, text.slice(0, 200)))
  }
  return res.json()
}

/** Bentuk path Dropbox untuk kategori: `/<kategori>/<file>` (relatif ke root namespace aplikasi). */
export function dropboxFolderPath(folderKey: DropboxFolderKey): string {
  const { base } = dropboxEnv()
  const folder = DROPBOX_FOLDERS[folderKey]
  return base ? `/${base}/${folder}` : `/${folder}`
}

async function saveDropbox(input: PdfInput, prefix: string, folderKey: DropboxFolderKey): Promise<StoredFile> {
  assertPdf(input.bytes.length, input.type)
  const token = await dropboxAccessToken()
  const filename = `${prefix}-${randomUUID()}.pdf`
  const path = `${dropboxFolderPath(folderKey)}/${filename}`
  const upload = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path, mode: 'add', autorename: true }),
    },
    body: new Uint8Array(input.bytes),
  })
  if (!upload.ok) {
    const text = await upload.text().catch(() => '')
    const tag = extractDropboxTag(text)
    console.error('[Dropbox] upload gagal', { status: upload.status, tag, body: text.slice(0, 300) })
    throw createError(mapDropboxError(upload.status, tag, 'write', text.slice(0, 200)))
  }
  const uploaded = (await upload.json()) as { path_lower?: string; path_display?: string }
  const finalPath = (uploaded.path_lower ?? uploaded.path_display ?? path).toLowerCase()
  const shared = (await dropboxRpc('sharing/create_shared_link_with_settings', {
    path: finalPath,
    settings: { requested_visibility: 'public' },
  })) as { url?: string }
  if (!shared.url) throw createError({ statusCode: 502, message: 'Gagal membuat link sharing Dropbox.' })
  // ?dl=0 = halaman preview → ?raw=1 = langsung unduh/stream PDF.
  const url = shared.url.replace('dl=0', 'raw=1')
  return { url, path: finalPath }
}

async function deleteDropbox(path: string | null | undefined): Promise<void> {
  if (!path || !path.startsWith('/')) return
  await dropboxRpc('files/delete_v2', { path })
}

/* ---------- API umum ---------- */

export async function savePdfUpload(
  input: PdfInput,
  prefix = 'surat',
  folderKey: DropboxFolderKey = 'SURAT',
): Promise<StoredFile> {
  if (storageDriver() === 'dropbox') return saveDropbox(input, prefix, folderKey)
  return saveLocal(input, prefix)
}

export async function deleteStoredFile(
  url: string | null | undefined,
  dropboxPath?: string | null,
): Promise<void> {
  if (storageDriver() === 'dropbox') {
    await deleteDropbox(dropboxPath)
    return
  }
  deleteLocal(url)
}
