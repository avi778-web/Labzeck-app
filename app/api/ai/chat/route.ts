import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ensureMongoConnection } from '@/lib/mongodb'

const gateway = createGateway()
const FREE_LIMIT = 5

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return Response.json({ error: 'Please sign in to use Labzeck AI.' }, { status: 401 })

  const body = await request.json()
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : []
  if (!messages.length) return Response.json({ error: 'Type a message first.' }, { status: 400 })

  const mongo = await ensureMongoConnection()
  const userId = session.user.id
  const user = await mongo.users.findOne({ userId })
  const used = user?.aiMessagesUsed ?? 0
  if (!user?.activeSubscription && used >= FREE_LIMIT) {
    return Response.json({ error: 'Your 5 free AI messages are finished. Upgrade to continue.', upgradeRequired: true }, { status: 402 })
  }

  await mongo.users.updateOne({ userId }, { $setOnInsert: { userId, email: session.user.email, createdAt: new Date() }, $inc: { aiMessagesUsed: 1 } }, { upsert: true })
  await mongo.aiUsage.insertOne({ userId, createdAt: new Date(), messageCount: messages.length })

  const result = streamText({
    model: gateway('google/gemini-2.5-flash'),
    system: 'You are Labzeck personal AI. Help users with hiring, local work, profiles, subscriptions, safety, and app guidance. Be concise, warm, practical, and never invent Labzeck account data. Reply in the user\'s language. Offer 3 or 4 suggested next questions after your answer, each short and actionable.',
    messages,
  })
  return result.toTextStreamResponse()
}
