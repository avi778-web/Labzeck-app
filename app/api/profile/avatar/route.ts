import { NextRequest, NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'
import { avatarUpdate } from '@/lib/validation'

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'anonymous'
  const parsed = avatarUpdate.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Avatar image is invalid or too large.' }, { status: 400 })
  const { avatars, users } = await getMongo()
  const updatedAt = new Date()
  await avatars.updateOne({ userId }, { $set: { userId, avatar: parsed.data.avatar, updatedAt } }, { upsert: true })
  await users.updateOne({ userId }, { $set: { avatar: parsed.data.avatar, updatedAt } })
  return NextResponse.json({ ok: true, avatar: parsed.data.avatar })
}
