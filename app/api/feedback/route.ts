import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ensureMongoConnection } from '@/lib/mongodb'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return Response.json({ error: 'Please sign in first.' }, { status: 401 })
  const body = await request.json()
  const rating = Number(body.rating)
  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) : ''
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: 'Choose a rating from 1 to 5.' }, { status: 400 })
  const mongo = await ensureMongoConnection()
  await mongo.feedback.insertOne({ userId: session.user.id, rating, comment, createdAt: new Date() })
  return Response.json({ ok: true })
}
