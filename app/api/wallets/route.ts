import { NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    const { wallets } = await getMongo()
    const wallet = await wallets.findOne({ userId })
    const transactions = await wallets.find({ userId, kind: 'transaction' }).sort({ createdAt: -1 }).limit(50).toArray()
    return NextResponse.json({ wallet: wallet ?? { userId, balance: 0 }, transactions })
  } catch { return NextResponse.json({ error: 'Unable to load wallet' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.userId || !['sent', 'received', 'bank'].includes(body.type)) return NextResponse.json({ error: 'Invalid wallet request' }, { status: 400 })
    const { wallets } = await getMongo()
    const now = new Date()
    if (body.type === 'bank') { await wallets.updateOne({ userId: body.userId, kind: 'wallet' }, { $set: { userId: body.userId, kind: 'wallet', bank: { provider: body.provider, accountLast4: String(body.accountNumber ?? '').slice(-4) }, updatedAt: now }, $setOnInsert: { balance: 0, createdAt: now } }, { upsert: true }); return NextResponse.json({ ok: true }) }
    const amount = Number(body.amount)
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    await wallets.insertOne({ userId: body.userId, kind: 'transaction', type: body.type, amount, title: body.title || (body.type === 'sent' ? 'Payment Sent' : 'Payment Received'), createdAt: now })
    await wallets.updateOne({ userId: body.userId, kind: 'wallet' }, { $inc: { balance: body.type === 'received' ? amount : -amount }, $set: { updatedAt: now }, $setOnInsert: { userId: body.userId, kind: 'wallet', createdAt: now } }, { upsert: true })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Unable to update wallet' }, { status: 500 }) }
} 
