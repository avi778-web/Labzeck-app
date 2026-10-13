import { NextRequest, NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'
import { coordinates } from '@/lib/validation'

export async function PUT(request: NextRequest) {
  const body = await request.json()
  if (!body.jobId || !body.userId) return NextResponse.json({ error: 'Job and user are required.' }, { status: 400 })
  const parsed = coordinates.safeParse(body.location)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid location.' }, { status: 400 })
  const { jobs, users } = await getMongo()
  await users.updateOne({ userId: body.userId }, { $set: { currentLocation: parsed.data, updatedAt: new Date() } })
  const result = await jobs.findOneAndUpdate({ jobId: body.jobId }, { $set: { liveLocation: parsed.data, locationSharedAt: new Date(), updatedAt: new Date() } }, { returnDocument: 'after' })
  return result ? NextResponse.json({ job: result }) : NextResponse.json({ error: 'Job request not found.' }, { status: 404 })
}
