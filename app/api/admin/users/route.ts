import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getMongo } from '@/lib/mongodb'

async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  const adminEmail = process.env.ADMIN_EMAIL
  if (!session?.user || !adminEmail || session.user.email.toLowerCase() !== adminEmail.toLowerCase()) return null
  return session
}

export async function GET(request: Request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const { users, labourers, subscriptions } = await getMongo()
  const [userCount, labourCount, activeSubscriptions, records] = await Promise.all([users.countDocuments(), labourers.countDocuments(), subscriptions.countDocuments({ status: 'paid' }), users.find({}, { projection: { name: 1, email: 1, hasBlueTick: 1, status: 1, role: 1 } }).limit(100).toArray()])
  return NextResponse.json({ stats: { users: userCount, labourers: labourCount, activeSubscriptions }, users: records })
}

export async function PATCH(request: Request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  if (typeof body.userId !== 'string' || !['blueTick', 'status'].includes(body.action)) return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 })
  const { users, labourers } = await getMongo()
  const update = body.action === 'blueTick' ? { hasBlueTick: Boolean(body.value), isVerified: Boolean(body.value) } : { status: body.value }
  if (body.action === 'status' && !['active', 'suspended', 'blocked'].includes(body.value)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  await Promise.all([users.updateOne({ _id: body.userId }, { $set: update }), labourers.updateOne({ userId: body.userId }, { $set: update })])
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const userId = new URL(request.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  const { users, labourers } = await getMongo()
  await Promise.all([users.deleteOne({ _id: userId }), labourers.deleteOne({ userId })])
  return NextResponse.json({ ok: true })
}
