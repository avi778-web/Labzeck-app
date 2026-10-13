import { NextRequest, NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'
import { jobDecision, jobRequest } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = jobRequest.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid job request.' }, { status: 400 })
  const { db, users } = await getMongo()
  const userId = body.userId || 'anonymous'
  const user = await users.findOne({ userId })
  const job = { jobId: crypto.randomUUID(), userId, labourId: parsed.data.labourId, ...parsed.data, userLocation: user?.currentLocation || parsed.data.location, status: 'requested', createdAt: new Date(), updatedAt: new Date() }
  await db.collection('job_requests').insertOne(job)
  return NextResponse.json({ job }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const parsed = jobDecision.safeParse(body)
  if (!parsed.success || !body.jobId) return NextResponse.json({ error: 'Invalid job decision.' }, { status: 400 })
  const { db } = await getMongo()
  const update: Record<string, unknown> = { status: parsed.data.status, updatedAt: new Date() }
  if (parsed.data.negotiatedRate) update.negotiatedRate = parsed.data.negotiatedRate
  const result = await db.collection('job_requests').findOneAndUpdate({ jobId: body.jobId, labourId: body.labourId }, { $set: update }, { returnDocument: 'after' })
  if (!result) return NextResponse.json({ error: 'Job request not found.' }, { status: 404 })
  return NextResponse.json({ job: result })
}
