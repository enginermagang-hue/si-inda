import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'

const PREFIX = 'scrypt'
const N = 16384
const r = 8
const p = 1
const KEY_LEN = 64

function scryptAsync(
  password: string,
  salt: string,
  keyLen: number,
  opts: { N: number; r: number; p: number } = { N, r, p },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keyLen, opts, (err, derived) => {
      if (err) reject(err)
      else resolve(derived as Buffer)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scryptAsync(password, salt, KEY_LEN)
  return `${PREFIX}$${N}$${r}$${p}$${salt}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== PREFIX) return false
  const [, nStr, rStr, pStr, salt, hashHex] = parts
  const derived = await scryptAsync(password, salt as string, KEY_LEN, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr),
  })
  const expected = Buffer.from(hashHex as string, 'hex')
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}
