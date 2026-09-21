/// <reference types="node" />
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

// SEMENTARA (diagnostik): Hono murni tanpa import server/* apapun.
// - /api/diag cepat → Hono sehat, hang berasal dari import server (db/storage/routes).
// - /api/diag ikut hang → masalah di Hono/runtime, bukan kode kita.
const diag = new Hono()
diag.get('/api/diag', (c) =>
  c.json({
    ok: true,
    diag: true,
    node: process.version,
    hasTursoUrl: Boolean(process.env.TURSO_URL?.trim()),
    storage: process.env.STORAGE_DRIVER?.trim() || 'local',
    time: new Date().toISOString(),
  }),
)

export default handle(diag)
