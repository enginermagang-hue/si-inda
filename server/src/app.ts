import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { publicApi } from './routes/public.js'
import { adminApi } from './routes/admin.js'
import { ensureUploadDir, storageDriver } from './lib/storage.js'

export const app = new Hono()

// CORS longgar khusus development Vite (5173). Di production Vercel,
// frontend dan API satu origin sehingga CORS tidak terpakai.
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim() || 'http://localhost:5173'
app.use(
  '/api/*',
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
)

app.get('/api/health', (c) =>
  c.json({ ok: true, storage: storageDriver, time: new Date().toISOString() }),
)

// Diagnostik remote (tanpa secret): kehadiran env + info runtime.
// Dipakai untuk membedakan "function jalan, env kurang" vs "function hang".
app.get('/api/debug', (c) =>
  c.json({
    ok: true,
    runtime: 'vercel' in process.env ? 'vercel' : 'node',
    node: process.version,
    storage: storageDriver,
    env: {
      jwtSecret: Boolean(process.env.JWT_SECRET?.trim()),
      tursoUrl: Boolean(process.env.TURSO_URL?.trim()),
      tursoToken: Boolean(process.env.TURSO_AUTH_TOKEN?.trim()),
      dropbox: Boolean(
        process.env.DROPBOX_APP_KEY?.trim() &&
          process.env.DROPBOX_APP_SECRET?.trim() &&
          process.env.DROPBOX_REFRESH_TOKEN?.trim(),
      ),
    },
    time: new Date().toISOString(),
  }),
)

app.route('/api', publicApi)
app.route('/api/admin', adminApi)

// File PDF surat lokal: GET /uploads/<nama-file>.
// Hanya aktif untuk driver 'local' (development). Di Vercel (driver dropbox),
// file disajikan langsung dari URL Dropbox sehingga route ini tidak dipasang.
if (storageDriver === 'local') {
  ensureUploadDir()
  app.use('/uploads/*', serveStatic({ root: './' }))
}

app.notFound((c) => c.json({ error: 'Endpoint tidak ditemukan.' }, 404))
