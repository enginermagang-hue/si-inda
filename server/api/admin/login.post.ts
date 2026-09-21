import { eq } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { admins } from '../../db/schema'
import { verifyPassword } from '../../utils/password'
import { createSessionToken, setSessionCookie } from '../../utils/auth'
import { readJsonBody } from '../../utils/validate'

// POST /api/admin/login
export default defineEventHandler(async (event) => {
  const b = await readJsonBody(event)
  const username = typeof b?.username === 'string' ? b.username.trim() : ''
  const password = typeof b?.password === 'string' ? b.password : ''
  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Username dan password wajib diisi.' })
  }
  const admin = await useDb().query.admins.findFirst({ where: eq(admins.username, username) })
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    throw createError({ statusCode: 401, message: 'Username atau password salah.' })
  }
  const token = await createSessionToken(admin.id, admin.username)
  setSessionCookie(event, token)
  return {
    data: {
      id: admin.id,
      name: admin.name,
      username: admin.username,
      mustChangePassword: admin.mustChangePassword === 1,
    },
  }
})
