import { NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

function validCoordinate(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const { name, email, role, location, language } = body
    const userId = session.user.id
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'User id and name are required' }, { status: 400 })
    }
    if (role !== 'hirer' && role !== 'labour') return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    const mongo = await getMongo()
    const now = new Date()
    const profile = { userId, name: name.trim().slice(0, 120), email: session.user.email || (typeof email === 'string' ? email.trim().slice(0, 200) : null), role, language: typeof language === 'string' ? language : 'English', updatedAt: now }
    await mongo.users.updateOne({ userId }, { $set: profile, $setOnInsert: { createdAt: now } }, { upsert: true })
    await (role === 'hirer' ? mongo.hirers : mongo.labourers).updateOne({ userId }, { $set: profile, $setOnInsert: { createdAt: now } }, { upsert: true })
    if (location && validCoordinate(location.lat) && validCoordinate(location.lng)) {
      await mongo.locations.updateOne({ userId }, { $set: { userId, role, lat: location.lat, lng: location.lng, updatedAt: now } }, { upsert: true })
    }
    return NextResponse.json({ ok: true, role })
  } catch (error) {
    console.error('[v0] Profile save failed:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Profile could not be saved' }, { status: 500 })
  }
}
