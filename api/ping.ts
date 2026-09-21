/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Canary: function paling minimal tanpa dependensi server.
// Jika /api/ping 200 tapi /api/* lain gagal → masalah di bundle/matching catch-all.
// Jika /api/ping pun gagal → masalah level platform/konfigurasi.
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.status(200).json({ ok: true, canary: 'ping', time: new Date().toISOString() })
}
