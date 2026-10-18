import { NextResponse } from 'next/server'
import { timingSafeEqual, scrypt as nodeScrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { getMongo } from '@/lib/mongodb'

type StoredUser = { _id: { toString(): string }; name: string; email: string; phone?: string; passwordHash?: string; verifiedStatus: boolean }
const scrypt = promisify(nodeScrypt)

async function verifyPassword(password: string, stored: string) {
  const [salt, encoded] = stored.split(':')
  if (!salt || !encoded) return false
  const actual = (await scrypt(password, salt, 64)) as Buffer
  const expected = Buffer.from(encoded, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string }
    const email = body.email?.trim().toLowerCase()
    if (!email || !body.password) return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 })
    const { users } = await getMongo()
    const user = await users.findOne({ email }) as StoredUser | null
    if (!user) return NextResponse.json({ success: false, message: 'Account not found. Please Sign Up first.' }, { status: 404 })
    if (!user.passwordHash || !(await verifyPassword(body.password, user.passwordHash))) return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 })
    return NextResponse.json({ success: true, user: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone, verifiedStatus: user.verifiedStatus } })
  } catch (error) {
    console.error('[Labzeck] Mongo sign-in failed:', error)
    return NextResponse.json({ success: false, message: 'Unable to sign in.' }, { status: 500 })
  }
}
