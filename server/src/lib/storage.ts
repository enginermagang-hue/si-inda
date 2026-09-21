import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { rootDir } from '../db/client.js'

export const UPLOAD_DIR = join(rootDir, 'uploads')
const MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB

export function ensureUploadDir(): void {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

/**
 * Simpan file upload PDF ke server/uploads.
 * Mengembalikan path relatif (disimpan di DB), mis. 'uploads/surat-xxx.pdf'.
 * Modul storage terisolasi: jika nanti pindah ke object storage (S3/R2),
 * cukup ganti isi fungsi ini + deleteStoredFile.
 */
export async function savePdfUpload(file: File, prefix = 'surat'): Promise<string> {
  if (file.type !== 'application/pdf') {
    throw new Error('File harus berformat PDF.')
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('Ukuran PDF maksimal 10 MB.')
  }
  const ext = extname(file.name).toLowerCase() || '.pdf'
  const filename = `${prefix}-${randomUUID()}${ext}`
  ensureUploadDir()
  const buffer = Buffer.from(await file.arrayBuffer())
  writeFileSync(join(UPLOAD_DIR, filename), buffer)
  return `uploads/${filename}`
}

export function deleteStoredFile(relativePath: string | null | undefined): void {
  if (!relativePath) return
  const safe = relativePath.replace(/^uploads\//, '').replace(/[/\\]/g, '')
  if (!safe) return
  const full = join(UPLOAD_DIR, safe)
  if (existsSync(full)) unlinkSync(full)
}
