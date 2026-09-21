import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { rootDir } from '../db/client.js'

/**
 * Driver penyimpanan file PDF surat.
 * - 'local'   : disk server/uploads (development).
 * - 'dropbox' : Dropbox API (production Vercel — disk serverless tidak permanen).
 * Modul ini terisolasi: ganti driver cukup via env STORAGE_DRIVER.
 */
export const storageDriver: 'local' | 'dropbox' =
  process.env.STORAGE_DRIVER?.trim() === 'dropbox' ? 'dropbox' : 'local'

export const UPLOAD_DIR = join(rootDir, 'uploads')
const MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB

export interface StoredFile {
  /** URL publik untuk diunduh (path relatif lokal atau URL Dropbox). */
  url: string
  /** Path internal untuk hapus (path Dropbox atau path relatif lokal). NULL bila tak ada. */
  path: string | null
}

function assertPdf(file: File): void {
  if (file.type !== 'application/pdf') throw new Error('File harus berformat PDF.')
  if (file.size > MAX_PDF_BYTES) throw new Error('Ukuran PDF maksimal 10 MB.')
}

/* ---------- Driver lokal ---------- */

export function ensureUploadDir(): void {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

async function saveLocal(file: File, prefix: string): Promise<StoredFile> {
  assertPdf(file)
  const ext = extname(file.name).toLowerCase() || '.pdf'
  const filename = `${prefix}-${randomUUID()}${ext}`
  ensureUploadDir()
  writeFileSync(join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()))
  return { url: `uploads/${filename}`, path: `uploads/${filename}` }
}

function deleteLocal(relativePath: string | null | undefined): void {
  if (!relativePath) return
  const safe = relativePath.replace(/^uploads\//, '').replace(/[/\\]/g, '')
  if (!safe) return
  const full = join(UPLOAD_DIR, safe)
  if (existsSync(full)) unlinkSync(full)
}

/* ---------- Driver Dropbox ---------- */

function dropboxEnv(): { appKey: string; appSecret: string; refreshToken: string; folder: string } {
  const appKey = process.env.DROPBOX_APP_KEY?.trim() ?? ''
  const appSecret = process.env.DROPBOX_APP_SECRET?.trim() ?? ''
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN?.trim() ?? ''
  const folder = process.env.DROPBOX_FOLDER?.trim() || '/siindah/surat'
  if (!appKey || !appSecret || !refreshToken) {
    throw new Error('DROPBOX_APP_KEY / DROPBOX_APP_SECRET / DROPBOX_REFRESH_TOKEN wajib diisi untuk driver dropbox.')
  }
  return { appKey, appSecret, refreshToken, folder }
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function dropboxAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token
  const { appKey, appSecret, refreshToken } = dropboxEnv()
  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    }),
  })
  if (!res.ok) throw new Error(`Gagal refresh token Dropbox (${res.status}). Periksa kredensial.`)
  const data = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error('Respons token Dropbox tidak valid.')
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 14_000) * 1000 - 60_000 }
  return cachedToken.token
}

async function dropboxRpc(endpoint: string, body: unknown): Promise<unknown> {
  const token = await dropboxAccessToken()
  const res = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Dropbox API ${endpoint} gagal (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json()
}

async function saveDropbox(file: File, prefix: string): Promise<StoredFile> {
  assertPdf(file)
  const { folder } = dropboxEnv()
  const token = await dropboxAccessToken()
  const filename = `${prefix}-${randomUUID()}.pdf`
  const path = `${folder}/${filename}`
  const upload = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path, mode: 'add', autorename: true }),
    },
    body: Buffer.from(await file.arrayBuffer()),
  })
  if (!upload.ok) {
    throw new Error(`Upload ke Dropbox gagal (${upload.status}).`)
  }
  const uploaded = (await upload.json()) as { path_lower?: string; path_display?: string }
  const finalPath = (uploaded.path_lower ?? uploaded.path_display ?? path).toLowerCase()
  // Buat shared link permanen agar bisa diunduh publik tanpa lewat server.
  const shared = (await dropboxRpc('sharing/create_shared_link_with_settings', {
    path: finalPath,
    settings: { requested_visibility: 'public' },
  })) as { url?: string }
  if (!shared.url) throw new Error('Gagal membuat link sharing Dropbox.')
  // ?dl=0 = halaman preview → ?raw=1 = langsung unduh/stream PDF.
  const url = shared.url.replace('dl=0', 'raw=1')
  return { url, path: finalPath }
}

async function deleteDropbox(path: string | null | undefined): Promise<void> {
  if (!path || !path.startsWith('/')) return
  await dropboxRpc('files/delete_v2', { path })
}

/* ---------- API umum ---------- */

export async function savePdfUpload(file: File, prefix = 'surat'): Promise<StoredFile> {
  if (storageDriver === 'dropbox') return saveDropbox(file, prefix)
  return saveLocal(file, prefix)
}

export async function deleteStoredFile(
  url: string | null | undefined,
  dropboxPath?: string | null,
): Promise<void> {
  if (storageDriver === 'dropbox') {
    await deleteDropbox(dropboxPath)
    return
  }
  deleteLocal(url)
}
