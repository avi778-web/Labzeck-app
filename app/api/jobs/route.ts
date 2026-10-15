import { NextRequest, NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'
import { jobDecision, jobRequest } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = jobRequest.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid job request.', details: parsed.error.flatten() }, { status: 400 })
    const { db, users } = await getMongo()
    const userId = typeof body.userId === 'string' && body.userId ? body.userId : 'anonymous'
    const user = await users.findOne({ userId })
    const job = { jobId: crypto.randomUUID(), userId, labourId: parsed.data.labourId, ...parsed.data, userLocation: user?.currentLocation || parsed.data.location, status: 'requested', createdAt: new Date(), updatedAt: new Date() }
    await db.collection('job_requests').insertOne(job)
    console.log('[v0] Job saved:', job.jobId)
    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (error) {
    console.error('[v0] Job save failed:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Job could not be saved' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = jobDecision.safeParse(body)
    if (!parsed.success || typeof body.jobId !== 'string') return NextResponse.json({ success: false, error: 'Invalid job decision.' }, { status: 400 })
    const { db } = await getMongo()
    const update: Record<string, unknown> = { status: parsed.data.status, updatedAt: new Date() }
    if (parsed.data.negotiatedRate) update.negotiatedRate = parsed.data.negotiatedRate
    const result = await db.collection('job_requests').findOneAndUpdate({ jobId: body.jobId, labourId: body.labourId }, { $set: update }, { returnDocument: 'after' })
    if (!result) return NextResponse.json({ success: false, error: 'Job request not found.' }, { status: 404 })
    console.log('[v0] Job updated:', body.jobId)
    return NextResponse.json({ success: true, job: result })
  } catch (error) {
    console.error('[v0] Job update failed:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Job could not be updated' }, { status: 500 })
  }
}
