import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

// Script migrasi via tsx (di luar runtime Nuxt): baca env NUXT_* / TURSO_*.
const tursoUrl = process.env.NUXT_TURSO_URL?.trim() || process.env.TURSO_URL?.trim()
const tursoToken = process.env.NUXT_TURSO_AUTH_TOKEN?.trim() || process.env.TURSO_AUTH_TOKEN?.trim()

let client
if (tursoUrl) {
  if (!tursoToken) throw new Error('Token Turso wajib diisi saat URL diset.')
  client = createClient({ url: tursoUrl, authToken: tursoToken })
} else {
  client = createClient({ url: 'file:./dev.db' })
}

const db = drizzle(client)
await migrate(db, { migrationsFolder: './server/drizzle' })
console.log(`Migrasi selesai → ${tursoUrl ? 'Turso cloud' : 'dev.db lokal'}`)
process.exit(0)
