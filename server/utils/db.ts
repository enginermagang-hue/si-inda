import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'

let client: Client | null = null

function getClient(): Client {
  if (client) return client
  const config = useRuntimeConfig()
  const tursoUrl = (config.tursoUrl as string)?.trim()
  const tursoToken = (config.tursoAuthToken as string)?.trim()
  if (tursoUrl) {
    if (!tursoToken) throw new Error('NUXT_TURSO_AUTH_TOKEN wajib diisi saat NUXT_TURSO_URL diset.')
    client = createClient({ url: tursoUrl, authToken: tursoToken })
  } else {
    // Development lokal: SQLite file di root project.
    client = createClient({ url: 'file:./dev.db' })
  }
  return client
}

let dbInstance: LibSQLDatabase<typeof schema> | null = null

export function useDb(): LibSQLDatabase<typeof schema> {
  if (!dbInstance) dbInstance = drizzle(getClient(), { schema })
  return dbInstance
}

export { schema }
