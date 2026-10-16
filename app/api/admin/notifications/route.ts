import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getMongo } from '@/lib/mongodb'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return NextResponse.json({ success: false, error: 'Sign in required.' }, { status: 401 })
    const { users, notifications } = await getMongo()
    const actor = await users.findOne({ $or: [{ userId: session.user.id }, { _id: session.user.id }] })
    if (actor?.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 })
    const body = await request.json()
    if (typeof body.title !== 'string' || typeof body.message !== 'string') return NextResponse.json({ success: false, error: 'Title and message are required.' }, { status: 400 })
    const notification = { title: body.title.trim().slice(0, 120), message: body.message.trim().slice(0, 500), imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : null, deepLink: typeof body.deepLink === 'string' ? body.deepLink : '/', createdAt: new Date(), createdBy: session.user.id }
    const result = await notifications.insertOne(notification)
    return NextResponse.json({ success: true, notificationId: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    console.error('[Labzeck] broadcast notification failed', error)
    return NextResponse.json({ success: false, error: 'Notification could not be created.' }, { status: 500 })
  }
}
