import { handle } from 'hono/vercel'
import { app } from '../server/src/app.js'

// Entry serverless Vercel (catch-all): file ini menangani SEMUA request
// /api/* dengan path asli tetap utuh (tanpa rewrite), sehingga route Hono
// (/api/settings/public, /api/admin/login, ...) cocok langsung.
// Pastikan env JWT_SECRET, TURSO_URL, TURSO_AUTH_TOKEN, STORAGE_DRIVER,
// dan DROPBOX_* terisi di dashboard Vercel (Production + Preview + Development).
export const config = {
  maxDuration: 30,
}

export default handle(app)
