import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../server/utils/password'

describe('password hashing (scrypt)', () => {
  it('hash lalu verifikasi password benar', async () => {
    const hash = await hashPassword('admin123')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('admin123', hash)).toBe(true)
  })

  it('menolak password salah dan format rusak', async () => {
    const hash = await hashPassword('admin123')
    expect(await verifyPassword('salah', hash)).toBe(false)
    expect(await verifyPassword('admin123', 'bukan-format-valid')).toBe(false)
  })
})
