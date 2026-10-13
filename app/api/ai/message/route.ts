import { NextRequest, NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'
import { aiMessage } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'anonymous'
  const parsed = aiMessage.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  const { aiUsage } = await getMongo()
  const current = await aiUsage.findOne({ userId })
  const used = current?.count || 0
  if (used >= 5) return NextResponse.json({ locked: true, used, limit: 5, error: 'Your 5 free AI trials are complete. Upgrade to continue.' }, { status: 402 })
  const nextCount = used + 1
  await aiUsage.updateOne({ userId }, { $set: { count: nextCount, updatedAt: new Date() }, $push: { messages: { role: 'user', content: parsed.data.message, createdAt: new Date() } } }, { upsert: true })
  return NextResponse.json({ locked: nextCount >= 5, used: nextCount, limit: 5, reply: 'I can help you compare nearby work, prepare a job request, or understand your Labzeck profile.' })
}
