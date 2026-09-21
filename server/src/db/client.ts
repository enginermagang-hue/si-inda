import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// .env dibaca manual agar tanpa dependensi tambahan
const envPath = resolve(rootDir, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const idx = trimmed.indexOf('=')
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (key && !(key in process.env)) process.env[key] = value
  }
}

const tursoUrl = process.env.TURSO_URL?.trim()
const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim()

let client: Client
if (tursoUrl) {
  if (!tursoToken) throw new Error('TURSO_AUTH_TOKEN wajib diisi saat TURSO_URL diset.')
  client = createClient({ url: tursoUrl, authToken: tursoToken })
} else {
  const dbPath = resolve(rootDir, 'dev.db')
  mkdirSync(dirname(dbPath), { recursive: true })
  client = createClient({ url: `file:${dbPath}` })
}

export const db: LibSQLDatabase<typeof schema> = drizzle(client, { schema })
export { client }
export const isTurso = Boolean(tursoUrl)
export { rootDir }
