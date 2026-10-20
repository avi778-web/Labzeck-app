import { NextRequest, NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json()
    if (typeof credential !== 'string' || credential.length < 20) return NextResponse.json({ success: false, error: 'Google credential is missing.' }, { status: 400 })
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { cache: 'no-store' })
    if (!response.ok) return NextResponse.json({ success: false, error: 'Google sign-in could not be verified.' }, { status: 401 })
    const googleUser = await response.json() as { sub?: string; email?: string; name?: string; picture?: string; aud?: string }
    if (!googleUser.sub || !googleUser.email) return NextResponse.json({ success: false, error: 'Google profile is incomplete.' }, { status: 401 })
    const expectedClientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim().replace(/^['"]|['"]$/g, '')
    if (!/^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(expectedClientId)) return NextResponse.json({ success: false, error: 'Google OAuth Client ID is invalid or not configured.' }, { status: 500 })
    if (googleUser.aud !== expectedClientId) return NextResponse.json({ success: false, error: 'Google client ID does not match the configured OAuth client.' }, { status: 401 })
    const { users } = await getMongo()
    const now = new Date()
    const user = await users.findOneAndUpdate({ googleId: googleUser.sub }, { $set: { googleId: googleUser.sub, email: googleUser.email.toLowerCase(), name: googleUser.name || googleUser.email.split('@')[0], image: googleUser.picture || null, updatedAt: now }, $setOnInsert: { createdAt: now, provider: 'google' } }, { upsert: true, returnDocument: 'after' })
    return NextResponse.json({ success: true, user: { id: user?._id?.toString(), name: user?.name, email: user?.email, image: user?.image } })
  } catch (error) {
    console.error('[Labzeck] Google auth failed:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Google sign-in failed.' }, { status: 500 })
  }
}
