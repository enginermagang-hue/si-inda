import { clearSessionCookie } from '../../utils/auth'

// POST /api/admin/logout
export default defineEventHandler((event) => {
  clearSessionCookie(event)
  return { message: 'Berhasil logout.' }
})
