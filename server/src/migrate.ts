import { migrate } from 'drizzle-orm/libsql/migrator'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, isTurso } from './db/client.js'

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle')

await migrate(db, { migrationsFolder })
console.log(`Migrasi selesai → ${isTurso ? 'Turso cloud' : 'dev.db lokal'}`)
process.exit(0)
