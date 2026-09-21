import { handle } from 'hono/vercel'
import { app } from '../server/src/app.js'

// Entry serverless Vercel: semua request /api/* ditangani satu function.
// Pastikan env JWT_SECRET, TURSO_URL, TURSO_AUTH_TOKEN, STORAGE_DRIVER,
// dan DROPBOX_* terisi di dashboard Vercel (Production + Preview + Development).
export const config = {
  maxDuration: 30,
}

export default handle(app)
