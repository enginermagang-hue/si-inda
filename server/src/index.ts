import { serve } from '@hono/node-server'
import { app } from './app.js'

// Entry khusus Node long-running (development / VPS).
// Di Vercel, entry-nya adalah api/index.ts (serverless) yang memakai app yang sama.
if (process.env.VERCEL !== '1') {
  const port = Number(process.env.PORT) || 3001
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`SIINDAH API berjalan di http://localhost:${info.port}`)
  })
}

export { app }
