import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getMongo } from '@/lib/mongodb'

const deviceSchema = z.object({ userId: z.string().min(1), token: z.string().min(10), platform: z.enum(['web', 'android', 'ios']).default('web') })

export async function POST(request: Request) {
  try {
    const parsed = deviceSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: 'A valid user ID and device token are required.' }, { status: 400 })
    const { devices } = await getMongo()
    await devices.updateOne({ userId: parsed.data.userId, token: parsed.data.token }, { $set: { ...parsed.data, active: true, lastSeenAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Labzeck] device registration failed', error)
    return NextResponse.json({ success: false, error: 'Device registration failed.' }, { status: 500 })
  }
}
