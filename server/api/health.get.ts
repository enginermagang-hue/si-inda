import { storageDriver } from '../utils/storage'

// GET /api/health
export default defineEventHandler(() => ({
  ok: true,
  storage: storageDriver(),
  time: new Date().toISOString(),
}))
