import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getMongo } from '@/lib/mongodb'

const clean = (value: unknown, max = 120) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const body = await request.json()
    const type = body.type === 'wallet' ? 'wallet' : 'bank'
    const values = type === 'bank'
      ? { holderName: clean(body.holderName), bankName: clean(body.bankName), accountNumber: clean(body.accountNumber, 34), confirmAccountNumber: clean(body.confirmAccountNumber, 34), ifsc: clean(body.ifsc, 16).toUpperCase(), accountType: body.accountType === 'current' ? 'current' : 'savings' }
      : { provider: clean(body.provider), upiId: clean(body.upiId, 120), holderName: clean(body.holderName) }
    if (Object.values(values).some((value) => !value) || (type === 'bank' && values.accountNumber !== values.confirmAccountNumber)) {
      return NextResponse.json({ error: 'Complete all payout details correctly' }, { status: 400 })
    }
    if (type === 'bank' && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(values.ifsc)) return NextResponse.json({ error: 'Enter a valid IFSC code' }, { status: 400 })
    const mongo = await getMongo()
    await mongo.payoutMethods.updateOne({ userId: session.user.id }, { $set: { userId: session.user.id, type, ...values, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Payout method could not be saved' }, { status: 500 })
  }
}
