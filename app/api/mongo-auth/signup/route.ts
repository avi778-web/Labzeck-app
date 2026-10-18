import { NextResponse } from 'next/server'
import { randomBytes, scrypt as nodeScrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { getMongo } from '@/lib/mongodb'
import type { UserDocument } from '@/lib/mongo-models'

const scrypt = promisify(nodeScrypt)
const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex')
  const key = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${key.toString('hex')}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; email?: string; phone?: string; password?: string; verifiedStatus?: boolean; authProvider?: 'credentials' | 'google' }
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const phone = body.phone?.trim()
    const password = body.password ?? ''
    if (!name || !email || !password || password.length < 8) return NextResponse.json({ success: false, message: 'Name, email and a password of at least 8 characters are required.' }, { status: 400 })
    const { users } = await getMongo()
    const existing = await users.findOne({ $or: [{ email }, ...(phone ? [{ phone }] : [])] })
    if (existing) return NextResponse.json({ success: false, message: 'User already registered with this Email or Phone. Please Sign In.' }, { status: 400 })
    const now = new Date()
    const user: UserDocument = { name, email, ...(phone ? { phone } : {}), passwordHash: await hashPassword(password), verifiedStatus: Boolean(body.verifiedStatus), authProvider: body.authProvider ?? 'credentials', createdAt: now, updatedAt: now }
    const result = await users.insertOne(user)
    console.log('✅ MongoDB User Saved', { collection: 'users', userId: result.insertedId.toString(), email })
    return NextResponse.json({ success: true, message: 'User registered & saved successfully', user: { id: result.insertedId.toString(), name, email, phone, verifiedStatus: user.verifiedStatus } }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) return NextResponse.json({ success: false, message: 'User already registered with this Email or Phone. Please Sign In.' }, { status: 400 })
    console.error('[Labzeck] Mongo signup failed:', error)
    return NextResponse.json({ success: false, message: 'Unable to create account.' }, { status: 500 })
  }
}
