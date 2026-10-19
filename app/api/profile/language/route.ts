import { NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const body = await request.json()
    const language = typeof body.language === 'string' ? body.language.trim() : ''
    if (!language || language.length > 32) return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    const mongo = await getMongo()
    await mongo.users.updateOne({ userId: session.user.id }, { $set: { language, 'preferences.language': language, updatedAt: new Date() } }, { upsert: true })
    return NextResponse.json({ success: true, language })
  } catch (error) {
    console.error('[Labzeck] Language preference save failed:', error)
    return NextResponse.json({ success: false, error: 'Language preference could not be saved' }, { status: 500 })
  }
}
