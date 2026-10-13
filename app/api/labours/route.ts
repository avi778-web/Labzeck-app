import { NextRequest, NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'
import { labourProfile } from '@/lib/validation'

export async function GET(request: NextRequest) {
  const { labourers } = await getMongo()
  const params = request.nextUrl.searchParams
  const query: Record<string, unknown> = { availabilityStatus: { $ne: 'offline' } }
  const occupation = params.get('occupation')
  const minRate = Number(params.get('minRate') || 500)
  const maxRate = Number(params.get('maxRate') || 100000)
  if (occupation) query.occupation = occupation
  query.dailyRate = { $gte: minRate, $lte: maxRate }
  const rows = await labourers.find(query).sort({ workerRank: -1, rating: -1 }).limit(50).toArray()
  return NextResponse.json({ labourers: rows })
}

export async function POST(request: NextRequest) {
  const parsed = labourProfile.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Please check the labour profile details.' }, { status: 400 })
  const { labourers } = await getMongo()
  const now = new Date()
  const document = { labourId: crypto.randomUUID(), ...parsed.data, workerRank: 1, rating: 0, createdAt: now, updatedAt: now }
  await labourers.insertOne(document)
  return NextResponse.json({ labourer: document }, { status: 201 })
}
