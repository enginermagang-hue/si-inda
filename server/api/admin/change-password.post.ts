import { eq } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { admins } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { hashPassword, verifyPassword } from '../../utils/password'
import { readJsonBody } from '../../utils/validate'

// POST /api/admin/change-password
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const b = await readJsonBody(event)
  const currentPassword = typeof b?.currentPassword === 'string' ? b.currentPassword : ''
  const newPassword = typeof b?.newPassword === 'string' ? b.newPassword : ''
  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, message: 'Password lama dan baru wajib diisi.' })
  }
  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'Password baru minimal 8 karakter.' })
  }
  const row = await useDb().query.admins.findFirst({ where: eq(admins.id, admin.id) })
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    throw createError({ statusCode: 400, message: 'Password lama salah.' })
  }
  await useDb()
    .update(admins)
    .set({ passwordHash: await hashPassword(newPassword), mustChangePassword: 0 })
    .where(eq(admins.id, admin.id))
  return { message: 'Password berhasil diganti.' }
})
