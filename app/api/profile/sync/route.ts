import { NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'
import { auth, currentUser } from '@clerk/nextjs/server'

function validCoordinate(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const clerkUser = await currentUser()
    const { name, email, role, location, language } = body
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'User id and name are required' }, { status: 400 })
    }
    if (role !== 'hirer' && role !== 'labour') return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    const mongo = await getMongo()
    const now = new Date()
    const selectedLanguage = typeof language === 'string' && language.trim().length <= 32 ? language.trim() : 'English'
    const profile = { userId, name: name.trim().slice(0, 120), email: clerkUser?.primaryEmailAddress?.emailAddress || (typeof email === 'string' ? email.trim().slice(0, 200) : null), role, language: selectedLanguage, preferences: { language: selectedLanguage }, updatedAt: now }
    await mongo.users.updateOne({ userId }, { $set: profile, $setOnInsert: { createdAt: now } }, { upsert: true })
    await (role === 'hirer' ? mongo.hirers : mongo.labourers).updateOne({ userId }, { $set: profile, $setOnInsert: { createdAt: now } }, { upsert: true })
    if (location && validCoordinate(location.lat) && validCoordinate(location.lng)) {
      await mongo.locations.updateOne({ userId }, { $set: { userId, role, lat: location.lat, lng: location.lng, updatedAt: now } }, { upsert: true })
    }
    return NextResponse.json({ ok: true, role })
  } catch (error) {
    console.error('[Labzeck] Profile save failed:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Profile could not be saved' }, { status: 500 })
  }
}
