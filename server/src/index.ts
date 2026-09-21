import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import { publicApi } from './routes/public.js'
import { adminApi } from './routes/admin.js'
import { ensureUploadDir } from './lib/storage.js'

const app = new Hono()

// CORS longgar khusus development Vite (5173). Di production, frontend dan
// API sebaiknya satu domain (reverse proxy), atau set FRONTEND_ORIGIN.
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim() || 'http://localhost:5173'
app.use(
  '/api/*',
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
)

app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))

app.route('/api', publicApi)
app.route('/api/admin', adminApi)

// File PDF surat: GET /uploads/<nama-file>
ensureUploadDir()
app.use('/uploads/*', serveStatic({ root: './' }))

app.notFound((c) => c.json({ error: 'Endpoint tidak ditemukan.' }, 404))

const port = Number(process.env.PORT) || 3001
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`SIINDAH API berjalan di http://localhost:${info.port}`)
})
